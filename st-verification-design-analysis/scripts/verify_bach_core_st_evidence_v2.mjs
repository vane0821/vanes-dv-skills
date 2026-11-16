import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
const file="st-verification-design-analysis/templates/bach-core-st-tp-evidence-input-v2.xlsx";
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(file));
const names=wb.worksheets.items.map(s=>s.name);
const expected=["输入件描述与分析","Path特性","通路与地址空间","TS","DTE","MU","VU","校准问题"];
if(names.join(",")!==expected.join(","))throw new Error(`Sheet顺序错误: ${names}`);
const paths=wb.worksheets.getItem("通路与地址空间").getRange("A5:P39").values;
for(let i=0;i<paths.length;i++){if(i&& !paths[i][0])paths[i][0]=paths[i-1][0];if(i&& !paths[i][2])paths[i][2]=paths[i-1][2];if(i&& !paths[i][3])paths[i][3]=paths[i-1][3];}
if(paths.length!==35)throw new Error(`通路数量错误: ${paths.length}`);
if(paths.some(r=>/dte_dsa2matrix_mem_(data|scale)_/.test(r[1])))throw new Error("DSA视角Matrix不得拆Region");
const features=wb.worksheets.getItem("Path特性").getRange("A5:J17").values;
const fmap=new Map(features.map(r=>[r[0],r]));
if(features.some(r=>!r[0]||!r[2]))throw new Error("Path特性不得缺特性ID/特性项");
const required={APB:["顺序属性","访问size","Burst能力"],AXI:["顺序属性","访问size","Burst类型","AXLEN位宽","Outstanding","Read Interleave"]};
for(const p of paths){const proto=String(p[3]).startsWith("AXI4→APB")?"APB":p[3]==="AXI4→AXI4"?"AXI":null;if(!proto)continue;const ids=String(p[11]||"").split(",").filter(Boolean),items=new Set(ids.map(id=>{if(!fmap.has(id))throw new Error(`${p[1]}引用不存在特性${id}`);return fmap.get(id)[2];}));for(const item of required[proto])if(!items.has(item))throw new Error(`${p[1]}缺少${proto}必填特性:${item}`);for(const id of ids)if(!String(fmap.get(id)[6]).split(/[\n,]/).includes(p[2]))throw new Error(`特性${id}未反向关联${p[2]}`);if(proto==="AXI"&&!String(p[9]).startsWith("axi_size_"))throw new Error(`${p[1]}访问粒度未显示size特性ID`);}
for(const f of features){if(/_(legal|illegal|conditional)_\d{3}/.test(String(f[6])))throw new Error(`特性仍关联地址分段ID:${f[0]}`);for(const pathName of String(f[6]||"").split(/[\n,]/).filter(Boolean)){const related=paths.filter(r=>r[2]===pathName);if(!related.length||related.some(p=>!String(p[11]).split(",").includes(f[0])))throw new Error(`Path/特性反标不一致:${f[0]}→${pathName}`);}}
for(const [id,value] of [["axi_size_core_mem_4b_32b","4/8/16/32 Byte"],["axi_size_matrix_mem_4b_32b","4/8/16/32 Byte"],["axi_size_share_mem_4b","4 Byte"]]){const f=fmap.get(id);if(!f||f[3]!==value||f[8]!=="已确认"||f[9])throw new Error(`${id}未按已确认size建模`);}
const desc=wb.worksheets.getItem("输入件描述与分析").getRange("A1:K220").values;
const customHeader=desc.findIndex(r=>r[0]==="协议名称"),mappingHeader=desc.findIndex(r=>r[0]==="通路ID");
const sourceHeader=desc.findIndex(r=>r[0]==="来源ID"),objHeader=desc.findIndex(r=>r[0]==="对象ID");
const sourceRows=desc.slice(sourceHeader+1,objHeader).filter(r=>r[0]);if(sourceRows.some(r=>r[0]==="SRC_010"))throw new Error("重复DTE来源SRC_010未合并");
for(const id of ["SRC_001","SRC_002","SRC_012","SRC_013","SRC_014","SRC_017","SRC_018","SRC_019","SRC_020","SRC_021","SRC_022"]){const r=sourceRows.find(x=>x[0]===id);if(!r||!String(r[2]).includes("https://pcng0ddyhlxs.feishu.cn/wiki/"))throw new Error(`${id}未使用真实飞书链接`);}
const typeRank={"Top设计文档":0,"模块设计文档":1,"代码文件":2,"人工确认":3};for(let i=1;i<sourceRows.length;i++)if(typeRank[sourceRows[i][1]]<typeRank[sourceRows[i-1][1]])throw new Error("输入来源未按类型分组");
const custom=desc.slice(customHeader+1,mappingHeader).filter(r=>r[2]);
if(custom.some(r=>String(r[6]||"").match(/^SRC_00(7|9|10)$/)))throw new Error("自定义协议依据未写章节或代码定位");
const objRows=desc.slice(objHeader+1).filter(r=>r[0]&&r[0]!=="协议名称"&&r[0]!=="通路ID"&&r[0]!=="规则项ID");
const checkObj=(name,proto,data,addr)=>{const r=objRows.find(x=>x[2]===name);if(!r||r[4]!==proto||r[5]!==data||r[6]!==addr)throw new Error(`对象校准错误:${name}`);};
checkObj("share_mem_s","AXI4",32,17);checkObj("core_mem_s","AXI4",256,21);checkObj("matrix_mem_s","AXI4",256,26);
for(const n of ["core_status_s","dte_core_s","dte_itcm_s","dte_dtcm_s","mu_itcm_s","mu_dtcm_s","mu_core_s","vu_itcm_s","vu_dtcm_s","vu_core_s","dte_dsa_cfg_s","mu_dsa_cfg_s","vu_dsa_cfg_s"])checkObj(n,"APB3",32,15);
checkObj("ts_cfg_s","APB3",32,15);
const dteRows=desc.slice(objHeader+1,customHeader).filter(r=>r[0]==="DTE_DSA"||(!r[0]&&String(r[4]||"").startsWith("Custom(dte2")));
const dteProtocols=dteRows.map(r=>r[4]);for(const p of ["Custom(dte2cm)","Custom(dte2mm，sel=0)","Custom(dte2sm)","Custom(dte2mu，共享dte2mm，sel=1)"])if(!dteProtocols.includes(p))throw new Error(`DTE_DSA接口未展开:${p}`);
if(dteRows.some(r=>String(r[4]).includes("/")))throw new Error("DTE_DSA接口仍压缩在单行");
if(dteRows.length!==4)throw new Error(`DTE_DSA展开行数错误:${dteRows.length}`);
const qs=wb.worksheets.getItem("校准问题").getRange("A5:L11").values;
if(qs.map(r=>r[0]).join(",")!=="Q_001,Q_002,Q_003,Q_004,Q_005,Q_006,Q_007")throw new Error("校准问题编号错误");
if(qs.some(r=>r[11]!=="待确认"||!r[1]||!r[2]||!r[3]||!r[4]))throw new Error("校准问题分类字段不完整");
const tsGrid=wb.worksheets.getItem("TS").getRange("A1:P140").values;const ts=tsGrid.flat();for(const x of ["寄存器信息","字段信息","关联与校准","接口信息","编程示例","Feature"])if(!ts.includes(x))throw new Error(`TS缺少分段:${x}`);
for(const x of ["TASK_CHAIN_xx_PC","DATAIN_TASK_PC","STREAM_NUM","TS_INIT_FINISH","TS_STATE","SELF_START","ROUTER_TABLE_xx"])if(!ts.includes(x))throw new Error(`TS MMIO缺少:${x}`);
for(const x of ["TS-FUNC-001","TS-FUNC-018","TS-CONSTR-001","TS-ERR-001","TS-PERF-003"])if(!ts.includes(x))throw new Error(`TS Feature缺少:${x}`);
for(const x of ["TS_EX_001","TS_EX_005"])if(!ts.includes(x))throw new Error(`TS编程示例缺少:${x}`);
const tsPath=paths.find(r=>r[1]==="scp_ctrl2ts_cfg_legal_001");if(!tsPath||tsPath[3]!=="AXI4→APB3"||!String(tsPath[12]).includes("TS-FUNC-001")||tsPath[14]!=="已确认"||tsPath[15])throw new Error("TS与全局Path未对齐");
const tsText=ts.join(" ").toLowerCase();if(tsText.includes("pstrb")||tsText.includes("pprot"))throw new Error("TS规范接口仍含已确认冗余信号");
const mmioRows=tsGrid.filter(r=>String(r[0]).startsWith("TS_REG_"));const mmio=id=>mmioRows.find(r=>r[0]===id);
if(mmio("TS_REG_015")?.[8]!==16||!String(mmio("TS_REG_015")?.[3]).includes("0x4800_8208")||!String(mmio("TS_REG_015")?.[3]).includes("offset 0x208"))throw new Error("STREAM_NUM Reset或地址归一化错误");
for(const id of ["TS_REG_001","TS_REG_002","TS_REG_019","TS_REG_020"]){const r=mmio(id);if(r?.[2]!=="64（xx=0~63）"||!String(r?.[3]).match(/\+[48]\*xx/))throw new Error(`${id}数组展开信息缺失`);}
for(const x of ["offset 0x200","offset 0x204","offset 0x208","offset 0x20C","offset 0x210","offset 0x214"])if(!ts.some(v=>String(v).includes(x)))throw new Error(`TS偏移显示错误:${x}`);
const dteGrid=wb.worksheets.getItem("DTE").getRange("A1:P140").values;const dte=dteGrid.flat();for(const x of ["寄存器信息","字段信息","关联与校准","接口信息","编程示例","Feature"])if(!dte.includes(x))throw new Error(`DTE缺少分段:${x}`);
for(const x of ["CFG_TRIGGER","CFG_TRANS_MODE","SYS_CTRL","SYS_STATUS","CONFIG_TEMPLATE_xx","TASKQ_ENTRY_xx","HEADER_TABLE_xx"])if(!dte.includes(x))throw new Error(`DTE MMIO缺少:${x}`);
for(const x of ["DTE-FUNC-001","DTE-FUNC-011","DTE-CONSTR-001","DTE-ERR-001","DTE-PERF-002","DTE-DBG-001"])if(!dte.includes(x))throw new Error(`DTE Feature缺少:${x}`);
for(const x of ["DTE_EX_001","DTE_EX_005"])if(!dte.includes(x))throw new Error(`DTE编程示例缺少:${x}`);
if(!dte.some(v=>String(v).includes("0x4802_8000"))||!dte.some(v=>String(v).includes("0x4802_B000+0x40*xx")))throw new Error("DTE全局地址归一化错误");
if(!dte.some(v=>String(v).includes("sel=0 Mmem；sel=1 MU TopK")))throw new Error("DTE Mmem/MU共享接口未闭合");
const dtePaths=paths.filter(r=>String(r[1]).startsWith("dte_dsa2"));if(dtePaths.filter(r=>/core_mem|matrix_mem|share_mem/.test(r[1])).some(r=>r[14]!=="已确认"||r[15]))throw new Error("DTE已闭合Path仍保留问题");
const topkPath=paths.find(r=>r[1]==="dte_dsa2mu_dsa_legal_001");if(!topkPath||topkPath[4]!=="0x0"||topkPath[5]!=="0xF"||!String(topkPath[9]).includes("256 Byte/entry")||topkPath[14]!=="已确认"||topkPath[15])throw new Error("DTE→MU TopK Path未按跨视角证据闭合");
if(!String(topkPath[13]).includes("SRC_019（5.2.7）"))throw new Error("DTE→MU TopK依据缺少MU 5.2.7");
for(const [sheetName,prefix,keys] of [["MU","MU",["CFG_TRIGGER","TOPK_TABLE","MU-FUNC-001","MU-ERR-001","MU_EX_003"]],["VU","VU",["macro_inst_trigger","error_code","VU-FUNC-001","VU-PERF-002","VU_EX_001"]]]){const grid=wb.worksheets.getItem(sheetName).getRange("A1:P140").values;const flat=grid.flat();for(const x of ["寄存器信息","字段信息","关联与校准","接口信息","编程示例","Feature",...keys])if(!flat.includes(x))throw new Error(`${sheetName}缺少:${x}`);}
const muGrid=wb.worksheets.getItem("MU").getRange("A1:P140").values;const topkReg=muGrid.find(r=>r[0]==="MU_REG_009");if(!topkReg||topkReg[2]!=="16（stream_id=0~15）"||!String(topkReg[3]).includes("0x100*stream_id")||!String(topkReg[6]).includes("32×4B"))throw new Error("MU TopK 5.2.7表项未完整提取");
if(qs.some(r=>String(r.slice(5,11).join(" ")).includes("MU_TOPK")))throw new Error("已闭合TopK问题仍出现在校准问题");
for(const f of features)if(String(f[6]||"").includes(","))throw new Error(`关联通路未使用换行:${f[0]}`);
const errors=await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",options:{useRegex:true,maxResults:100},summary:"formula errors",maxChars:2000});
if(!errors.ndjson.includes("matched 0 entries"))throw new Error(errors.ndjson);
console.log(JSON.stringify({checks:"PASS",sheets:names,pathCount:paths.length,featureCount:features.length,questionCount:qs.length}));
