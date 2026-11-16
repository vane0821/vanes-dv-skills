import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputPath = path.resolve("path-verification-testpoint-generator/templates/bach-core-path-tp-input-v1.xlsx");
const outputPath = path.resolve("st-verification-design-analysis/templates/bach-core-st-tp-evidence-input-v2.xlsx");
const previewDir = path.resolve("st-verification-design-analysis/.preview");
const old = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const wb = Workbook.create();

const C={navy:"#1F4E78",blue:"#D9EAF7",green:"#E2F0D9",amber:"#FFF2CC",red:"#FCE8E6",gray:"#F2F2F2"};
const font="Arial";
function title(s,range,text){s.getRange(range).merge();const r=s.getRange(range);r.values=[[text]];r.format={font:{name:font,size:14,bold:true},rowHeight:26};}
function section(s,range,text){s.getRange(range).merge();const r=s.getRange(range);r.values=[[text]];r.format={fill:C.blue,font:{name:font,size:11,bold:true},rowHeight:23};}
function header(r){r.format={fill:C.navy,font:{name:font,size:10,bold:true,color:"#FFFFFF"},horizontalAlignment:"center",verticalAlignment:"center",wrapText:true,borders:{preset:"all",style:"thin",color:"#D9E2F3"},rowHeight:34};}
function body(r){r.format={font:{name:font,size:10},verticalAlignment:"center",wrapText:true,borders:{preset:"inside",style:"thin",color:"#E7E6E6"}};}
function widths(s,map){for(const [c,w] of Object.entries(map))s.getRange(`${c}:${c}`).format.columnWidth=w;}
function addTable(s,start,headers,rows){s.getRange(`A${start}:${String.fromCharCode(64+headers.length)}${start}`).values=[headers];header(s.getRange(`A${start}:${String.fromCharCode(64+headers.length)}${start}`));if(rows.length){s.getRange(`A${start+1}:${String.fromCharCode(64+headers.length)}${start+rows.length}`).values=rows;body(s.getRange(`A${start+1}:${String.fromCharCode(64+headers.length)}${start+rows.length}`));}return start+rows.length+1;}
function mergeConsecutive(s,rows,startRow,colIndex,groupIndexes=[colIndex]){let begin=0;for(let i=1;i<=rows.length;i++){const same=i<rows.length&&groupIndexes.every(j=>rows[i][j]===rows[i-1][j]);if(same)continue;if(i-begin>1){const col=String.fromCharCode(65+colIndex);s.getRange(`${col}${startRow+begin}:${col}${startRow+i-1}`).merge();s.getRange(`${col}${startRow+begin}`).values=[[rows[begin][colIndex]]];}begin=i;}}
function rowsBetween(values,header0,nextHeader0){const start=values.findIndex(r=>r[0]===header0);if(start<0)return[];let end=values.length;for(let i=start+1;i<values.length;i++)if(values[i][0]===nextHeader0){end=i-1;break;}return values.slice(start+1,end).filter(r=>r[0]!==null&&r[0]!==undefined&&r[0]!=="");}
const base=old.worksheets.getItem("基础信息").getRange("A1:J120").values;
const oldSources=rowsBetween(base,"来源ID","对象ID");
const oldObjects=rowsBetween(base,"对象ID","协议名称");
const evidenceDetail={SRC_007:"SRC_007（rvcore2dsa接口信号表）",SRC_009:"SRC_009（bach_core_top.v端口连接）",SRC_010:"SRC_017（DTE MAS第5章；合并原SRC_010）"};
const customRows=rowsBetween(base,"协议名称",undefined).map(r=>{const n=r.slice(0,7);n[6]=String(n[6]||"").split(",").map(x=>evidenceDetail[x]||x).join("；");return n;});
const oldPaths=old.worksheets.getItem("通路与地址空间").getRange("A5:M39").values;
const rules=old.worksheets.getItem("验证规则").getRange("A5:H13").values.filter(r=>r[0]);
const mappings=old.worksheets.getItem("DUT映射").getRange("A5:G39").values.filter(r=>r[0]);

const sources=oldSources.map(r=>{
  const oldType=String(r[1]||"");
  const type=oldType.includes("用户")?"人工确认":oldType.includes("代码")?"代码文件":oldType.includes("Top")?"Top设计文档":oldType.includes("文档")||oldType.includes("飞书")?"模块设计文档":"人工确认";
  return [r[0],type,r[2],"Path/Module",r[0]==="SRC_010"?"DTE":"",r[3]];
}).filter(r=>!["SRC_006","SRC_010"].includes(r[0]));
const sourceUrls={
 SRC_001:"https://pcng0ddyhlxs.feishu.cn/wiki/OVnGwUdyBimdauk2D3JcjFq5nPe?table=tblsOaTrCGQp4LrB&view=vew3ZT50pn\nhttps://pcng0ddyhlxs.feishu.cn/wiki/IB00wb9Oyi1gtgkmEBBcqUfinQb",
 SRC_002:"https://pcng0ddyhlxs.feishu.cn/wiki/X1H9wcgKuiDcoYkZIQ8cR2Mknxf"
};
for(const r of sources)if(sourceUrls[r[0]])r[2]=sourceUrls[r[0]];
for(const r of sources){if(["SRC_001","SRC_002"].includes(r[0]))r[1]="Top设计文档";if(r[0]==="SRC_010")r[1]="模块设计文档";}
sources.push(["SRC_006","人工确认","2026-10-14讨论记录","Path","","APB目标通路强序；AXI目标通路弱序；AXI Slave支持不同访问size"]);
sources.push(["SRC_012","Top设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/OVnGwUdyBimdauk2D3JcjFq5nPe?table=tblsOaTrCGQp4LrB&view=vew3ZT50pn","Path","","逐Slave协议、地址/数据宽度、AXLEN位宽、Outstanding、Burst、Read Interleave"]);
sources.push(["SRC_013","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/VzcMwirkEivgG5knckxcTe7Cnig","Path/Module","TS","TS MAS：1.2 Features、3.1 Signal List、5 Programming Models、6 Performance"]);
sources.push(["SRC_014","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/DuEcwYKiMigJ03ktyVAc6Dr8nco","Path/Module","TS","TS LLD：1.1功能列表、2.2接口、2.4软件配置、4接口详细设计、5流程设计"]);
sources.push(["SRC_015","人工确认","2026-10-14讨论记录","Path/Module","TS","ts_cfg_s按APB3处理；PSTRB/PPROT属于设计文档和设计冗余，后续修改删除"]);
sources.push(["SRC_016","人工确认","2026-10-14讨论记录","Path/Module","TS","TS LLD 2.4.1及TS MAS 5.1中的0xFE00_0000为旧地址且错误；全局地址0x4800_8000~0x4800_FFFF为有效地址"]);
sources.push(["SRC_017","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/HH8iwPKfmizjURkVTgGcTA9Tn7d","Path/Module","DTE","DTE MAS：1.2 Features、2.1主要参数、3接口、4功能、5 Programming Model、6 Performance、9.1配置示例"]);
sources.push(["SRC_018","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/SRB2wgiMriAAsmkxq8KcpMF9nhc","Path/Module","DTE","DTE LLD：1 Feature映射、2.2接口、2.3寄存器、3功能、5接口、6流程、7测试要点"]);
sources.push(["SRC_019","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/ToRGwrg1ailJlCkFOMHcaREcnJf","Path/Module","MU","MU MAS：1.2 Features、3接口、5 Programming Model、6 Performance、9.1配置示例"]);
sources.push(["SRC_020","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/X6GcwqiS0iSlkckCFQCcFAwznAK","Path/Module","MU","MU详细设计：3外部接口与地址、4配置快照、5寄存器、7 topK、8数据布局、13数值、15异常、16状态、18性能；跳过内部流水实现"]);
sources.push(["SRC_021","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/QRZLwTnwIiEnfnkujhecFGh1nAh","Path/Module","VU","VU MAS：1.2 Features、3接口、5 Programming Model、6 Performance"]);
sources.push(["SRC_022","模块设计文档","https://pcng0ddyhlxs.feishu.cn/wiki/XTlOwMmojikq0lk2dA0cuw9knIc","Path/Module","VU","VU详细设计：2.2接口、4.1对外接口、5流程、6测试要点；跳过3章内部执行单元实现"]);
const sourceOrder={"Top设计文档":0,"模块设计文档":1,"代码文件":2,"人工确认":3};
sources.sort((a,b)=>(sourceOrder[a[1]]??9)-(sourceOrder[b[1]]??9)||String(a[0]).localeCompare(String(b[0])));

const apbNames=new Set(["core_status_s","ts_cfg_s","dte_core_s","dte_itcm_s","dte_dtcm_s","mu_itcm_s","mu_dtcm_s","mu_core_s","vu_itcm_s","vu_dtcm_s","vu_core_s","dte_dsa_cfg_s","mu_dsa_cfg_s","vu_dsa_cfg_s"]);
const axi={share_mem_s:[32,17],core_mem_s:[256,21],matrix_mem_s:[256,26]};
const objects=oldObjects.map(r=>{
  let protocol=r[3],data=r[4],addr=r[5],status=r[8],qid=r[9],evidence=r[7];
  if(apbNames.has(r[2])){protocol="APB3";data=32;addr=15;status="已确认";qid="";evidence="SRC_001,SRC_012";}
  if(axi[r[2]]){protocol="AXI4";[data,addr]=axi[r[2]];status="已确认";qid="";evidence="SRC_001,SRC_012";}
  return [r[0],r[1],r[2],r[2],protocol,data,addr,String(r[6]||"").replace("READ\nWRITE","RW"),evidence,status,qid];
});
for(const r of objects)if(r[2]==="ts_cfg_s"){r[4]="APB3";r[8]="SRC_001,SRC_012,SRC_013,SRC_014,SRC_015";r[9]="已确认";r[10]="";}
const dteObjectIndex=objects.findIndex(r=>r[0]==="DTE_DSA");
if(dteObjectIndex>=0)objects.splice(dteObjectIndex,1,
 ["DTE_DSA","Master","u_dte_dsa","u_dte_dsa","Custom(dte2cm)",2048,"14×2","RW","SRC_009,SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_DSA","Master","u_dte_dsa","u_dte_dsa","Custom(dte2mm，sel=0)",2048,"19×2","RW","SRC_009,SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_DSA","Master","u_dte_dsa","u_dte_dsa","Custom(dte2sm)",1024,32,"W","SRC_009,SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_DSA","Master","u_dte_dsa","u_dte_dsa","Custom(dte2mu，共享dte2mm，sel=1)",2048,"4-bit entry index","RW","SRC_009,SRC_017（3,4）,SRC_018（2.2,5）,SRC_019（5.2.7）","已确认",""]
);

const targetFromId=id=>id.match(/^scp_ctrl2(.+)_(?:legal|illegal)_\d+$/)?.[1]||"";
const targetProtocol=t=>t==="none"?"无目标":(["share_mem","core_mem_data","core_mem_scale","matrix_mem_data","matrix_mem_scale"].includes(t)?"AXI4":"APB3");
const endpointName=t=>t==="none"?"NONE":t.startsWith("core_mem")?"CORE_MEM":t.startsWith("matrix_mem")?"MATRIX_MEM":t.toUpperCase();
const pathDescription=(master,id)=>{if(id?.startsWith("scp_ctrl2"))return `SCP_CTRL→${endpointName(targetFromId(id))}`;const m=id?.match(/^(.+?)2(.+)_(?:legal|illegal|conditional)_\d+$/);return m?`${String(master||m[1]).toUpperCase()}→${endpointName(m[2])}`:`${master||"待确认"}→待确认`;};
const pathFeatures=new Map();
const addRef=(id,...features)=>pathFeatures.set(id,features);
const axiSizeFeature=slave=>slave==="share_mem"?"axi_size_share_mem_4b":`axi_size_${slave}_4b_32b`;
for(const r of oldPaths){const id=r[1];if(!id?.startsWith("scp_ctrl2"))continue;const t=targetFromId(id),p=targetProtocol(t);if(p==="APB3")addRef(id,"apb_order_strong","apb_size_4b","apb_burst_none");if(p==="AXI4"){
  const slave=t.startsWith("share_mem")?"share_mem":t.startsWith("core_mem")?"core_mem":"matrix_mem";
  addRef(id,"axi_order_weak","axi_burst_incr","axi_read_interleave_no",slave==="share_mem"?"axi_axlen_width_0":"axi_axlen_width_2",slave==="share_mem"?"axi_outstanding_16":"axi_outstanding_8",axiSizeFeature(slave));
}}
const paths=oldPaths.map(r=>{
  const [master,id,oldProtocol,start,end,legal,illegal,op,size,response,evidence,status,qid]=r;
  const t=targetFromId(id),p=id?.startsWith("scp_ctrl2")?targetProtocol(t):oldProtocol;
  const protocol=id?.startsWith("scp_ctrl2")?(p==="无目标"?"AXI4→无目标":t==="ts_cfg"?"AXI4→APB3":`AXI4→${p}`):oldProtocol;
  const refs=(pathFeatures.get(id)||[]).join(",");
  const qMap={Q_003:"Q_002",Q_004:"Q_003",Q_007:"Q_004"};
  const qids=[...new Set(String(qid||"").split(",").filter(q=>q&&!['Q_002','Q_005','Q_006','Q_008'].includes(q)).map(q=>qMap[q]||q))];
  const desc=pathDescription(master,id);const sizeDisplay=p==="AXI4"?(pathFeatures.get(id)||[]).find(x=>x.startsWith("axi_size_"))||"tbd":size;
  return [master,id,desc,protocol,start,end,legal,illegal,op,sizeDisplay,response,refs,"",evidence,status,qids.join(",")];
});

const unique=a=>[...new Set(a)];
const allByProtocol=proto=>unique(paths.filter(r=>r[3]===`AXI4→${proto}`||(proto==="APB3"&&String(r[3]).startsWith("AXI4→APB"))).map(r=>r[2])).join("\n");
const idsFor=prefix=>unique(paths.filter(r=>r[1].includes(prefix)&&r[3]==="AXI4→AXI4").map(r=>r[2])).join("\n");
const axiAll=allByProtocol("AXI4"),apbAll=allByProtocol("APB3");
const featureRows=[
 ["apb_order_strong","APB","顺序属性","强序","APB目标通路","",apbAll,"SRC_006","已确认",""],
 ["apb_size_4b","APB","访问size","4 Byte","APB目标通路","",apbAll,"SRC_008","已确认",""],
 ["apb_burst_none","APB","Burst能力","不支持Burst","APB目标通路","",apbAll,"SRC_012","已确认",""],
 ["axi_order_weak","AXI","顺序属性","弱序","AXI目标通路","",axiAll,"SRC_006","已确认",""],
 ["axi_burst_incr","AXI","Burst类型","INCR","AXI目标通路","",axiAll,"SRC_012","已确认",""],
 ["axi_read_interleave_no","AXI","Read Interleave","不支持","AXI目标通路","",axiAll,"SRC_012","已确认",""],
 ["axi_axlen_width_2","AXI","AXLEN位宽","2 bit","core_mem_s/matrix_mem_s","",[idsFor("core_mem"),idsFor("matrix_mem")].filter(Boolean).join("\n"),"SRC_012","已确认",""],
 ["axi_axlen_width_0","AXI","AXLEN位宽","0 bit","share_mem_s","",idsFor("share_mem"),"SRC_012","已确认",""],
 ["axi_outstanding_8","AXI","Outstanding","8","core_mem_s/matrix_mem_s","",[idsFor("core_mem"),idsFor("matrix_mem")].filter(Boolean).join("\n"),"SRC_012","已确认",""],
 ["axi_outstanding_16","AXI","Outstanding","16","share_mem_s","",idsFor("share_mem"),"SRC_012","已确认",""],
 ["axi_size_core_mem_4b_32b","AXI","访问size","4/8/16/32 Byte","core_mem_s","最小4B；最大不超过256-bit数据宽度",idsFor("core_mem"),"SRC_006","已确认",""],
 ["axi_size_matrix_mem_4b_32b","AXI","访问size","4/8/16/32 Byte","matrix_mem_s","最小4B；最大不超过256-bit数据宽度",idsFor("matrix_mem"),"SRC_006","已确认",""],
 ["axi_size_share_mem_4b","AXI","访问size","4 Byte","share_mem_s","最小4B；最大不超过32-bit数据宽度",idsFor("share_mem"),"SRC_006","已确认",""],
];

const tsMmioRows=[
 ["TS_REG_001","TASK_CHAIN_xx_PC","0x000+8*xx","32","TASK_PC","31:0","R/W",0,"32-bit","任务执行入口PC","","TS-FUNC-002","SRC_013（5.2.1）,SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_002","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_SEND_UNIT","1:0","R/W",0,"00=DTE;01=MU;10=VU;11保持旧值","任务发送单元","非法编码写入保持旧值","TS-FUNC-002","SRC_013（5.2.1）,SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_003","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_RECV_UNIT","3:2","R/W",0,"00=Core;01=DSA;10=Core+DSA;11保持旧值","任务完成判据","非法编码写入保持旧值","TS-FUNC-009","SRC_013（5.2.1）,SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_004","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","WAIT_WAKE","4","R/W",0,"0/1","是否等待外部数据唤醒","","TS-FUNC-005","SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_005","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_TYPE","7:5","R/W",0,"0普通;1 Reissue DataOut;2 Broadcast DataIn;3 P2P DataIn;4 Reduce;5 PID更新","任务类型","其它值保持旧值","TS-FUNC-006,TS-FUNC-010,TS-FUNC-012,TS-FUNC-013,TS-FUNC-016","SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_006","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_P2P_REISSUE_TID","13:8","R/W",0,"0~63","配对DataOut TID","","TS-FUNC-006,TS-FUNC-010,TS-FUNC-012","SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_007","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_CREDIT_EN","14","R/W",0,"0/1","是否申请方向Credit","","TS-FUNC-018","SRC_014（2.4.2.1）","已确认",""],
 ["TS_REG_008","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_PATH_ID","22:15","R/W",0,"0~255；Router表索引需0~63","任务PID","PID[7:6]非0时无法索引64项Router表","TS-FUNC-005,TS-FUNC-017","SRC_014（2.4.2.1,4.1.3）","已确认",""],
 ["TS_REG_009","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_END","23","R/W",0,"0/1","任务链结束标识","仅最后一个有效任务允许置1","TS-FUNC-002,TS-FUNC-014","SRC_014（2.4.2.1,2.4.3.2）","已确认",""],
 ["TS_REG_010","TASK_CHAIN_xx_ATTR","0x004+8*xx","32","TASK_VALID","31","R",0,"0/1","ATTR合法写入后由硬件置1","软件bit31写入无效","TS-FUNC-002","SRC_014（2.4.2.1,4.1.3）","已确认",""],
 ["TS_REG_011","DATAIN_TASK_PC","offset 0x200","32","TASK_PC","31:0","R/W",0,"32-bit","DataIn/权重加载DTE入口PC","","TS-FUNC-001","SRC_014（2.4.2.2）","已确认",""],
 ["TS_REG_012","DATAIN_TASK_ATTR","offset 0x204","32","WEIGHTS_MODE","0","R/W",0,"0/1","权重加载模式","置1不自动发任务，仍需Router Trigger","TS-FUNC-001","SRC_014（2.4.2.2,4.1.3）","已确认",""],
 ["TS_REG_013","DATAIN_TASK_ATTR","offset 0x204","32","TASK_SEND_UNIT","2:1","R",0,"固定DTE","DataIn执行单元","","TS-FUNC-001","SRC_014（2.4.2.2）","已确认",""],
 ["TS_REG_014","DATAIN_TASK_ATTR","offset 0x204","32","TASK_VALID","31","R",0,"0/1","软件配置后由硬件置有效","","TS-FUNC-001","SRC_014（2.4.2.2）","已确认",""],
 ["TS_REG_015","STREAM_NUM","offset 0x208","32","STREAM_NUM","4:0","R/W",0,"1~16","最大并行用户数","写0提交报错；大于16钳位为16","TS-FUNC-003","SRC_013（5.2.3）,SRC_014（2.4.2.3,2.4.3.2）","已确认",""],
 ["TS_REG_016","TS_INIT_FINISH","offset 0x20C","32","FINISH","0","R/W",0,"0/1","写1提交业务配置","成功或失败后均为1，需结合TS_STATE读取","TS-FUNC-001,TS-FUNC-002","SRC_013（5.2.4）,SRC_014（2.4.2.4,4.1.3）","已确认",""],
 ["TS_REG_017","TS_STATE","offset 0x210","32","TASK_CHAIN_ERROR","0","R",0,"0/1","业务配置检查错误标志","写该只读寄存器产生PSLVERR","TS-FUNC-002,TS-ERR-001","SRC_013（5.2.5）,SRC_014（2.4.2.5,4.1.3）","已确认",""],
 ["TS_REG_018","SELF_START","offset 0x214","32","SELF_START","0","R/W",0,"0普通;1自启动","B/R Core特殊模式","自启动要求DataIn PC/ATTR完整","TS-FUNC-015","SRC_013（5.2.6）,SRC_014（2.4.2.6,2.4.3.2）","已确认",""],
 ["TS_REG_019","ROUTER_TABLE_xx","0x400+4*xx","32","TASK_DIR","4:0","R/W",0,"bit0上;bit1下;bit2左;bit3右;bit4 local","PID路由方向","PID索引范围0~63","TS-FUNC-017,TS-FUNC-018","SRC_013（5.2.7）,SRC_014（2.4.2.7）","已确认",""],
 ["TS_REG_020","ROUTER_TABLE_xx","0x400+4*xx","32","TASK_VCID","6:5","R/W",0,"0~3","Router VCID","","TS-FUNC-017","SRC_013（5.2.7）,SRC_014（2.4.2.7）","已确认",""],
];
for(const r of tsMmioRows){
 const obj=r[1];
 let count="1";
 if(obj.startsWith("TASK_CHAIN_xx")){count="64（xx=0~63）";r[2]=obj.endsWith("_PC")?"0x4800_8000+8*xx（offset 0x000+8*xx）":"0x4800_8004+8*xx（offset 0x004+8*xx）";}
 else if(obj==="ROUTER_TABLE_xx"){count="64（xx=0~63）";r[2]="0x4800_8400+4*xx（offset 0x400+4*xx）";}
 else {const off={DATAIN_TASK_PC:"200",DATAIN_TASK_ATTR:"204",STREAM_NUM:"208",TS_INIT_FINISH:"20C",TS_STATE:"210",SELF_START:"214"}[obj];if(off)r[2]=`0x4800_8${off}（offset 0x${off}）`;}
 if(r[0]==="TS_REG_015"){r[7]=16;r[12]="SRC_013（变更记录,5.2.3）,SRC_014（变更记录,2.4.2.3）";}
 r.splice(2,0,count);
}

const tsInterfaceRows=[
 ["TS_IF_001","Clock/Reset","clk","I",1,"时钟复位","0/1","持续有效","TS同步接口工作时钟","","SRC_014（2.2）","已确认",""],
 ["TS_IF_002","Clock/Reset","rst_n","I",1,"时钟复位","0/1","低有效","TS全局异步复位","","SRC_014（2.2）","已确认",""],
 ["TS_IF_003","apb_cfg_ch","psel/penable/pwrite","I","1/1/1","请求握手","APB3","psel&&penable","配置读写控制","TS-FUNC-001","SRC_014（2.2,4.1.3）,SRC_015","已确认",""],
 ["TS_IF_004","apb_cfg_ch","paddr","I",15,"请求参数","4B对齐局部字节地址","Access阶段","32KB配置空间","TS-CONSTR-001","SRC_014（2.2,4.1.3）","已确认",""],
 ["TS_IF_005","apb_cfg_ch","pwdata","I","32","请求数据","32-bit","写Access阶段","完整32-bit配置写","TS-CONSTR-001","SRC_014（2.2,4.1.3）,SRC_015","已确认",""],
 ["TS_IF_006","apb_cfg_ch","prdata/pready/pslverr","O","32/1/1","错误返回","pready恒1","Access阶段","零等待读回；非法访问报pslverr","TS-ERR-001","SRC_014（2.2,4.1.3）","已确认",""],
 ["TS_IF_007","router2ts_trigger_ch","r2t_trigger_uid/pid/reissue","I","16/8/1","请求参数","UID/PID/reissue","valid&&!ready期间稳定","DataIn/权重加载入口参数","TS-FUNC-004,TS-FUNC-005,TS-FUNC-010,TS-FUNC-012","SRC_014（2.2,4.1.4）","已确认",""],
 ["TS_IF_008","router2ts_trigger_ch","r2t_trigger_valid/ready","I/O","1/1","请求握手","valid-ready","valid&&ready","接收Router Trigger","TS-FUNC-004","SRC_014（2.2,4.1.4）","已确认",""],
 ["TS_IF_009","router_credit_return_ch","r2dte_credit_e/w/ns_valid","I","1/1/1","返回握手","valid-only","每个高周期一笔","东/西/南北方向Credit归还，下一周期可用","TS-FUNC-018","SRC_014（2.2,4.1.4）","已确认",""],
 ["TS_IF_010","rmem2ts_reduce_done_ch","rmem2ts_credit_done_uid/valid","I","16/1","返回握手","valid-only","每个高周期一笔","按UID归还RMEM，不表示任务完成","TS-FUNC-013","SRC_014（2.2,4.1.4）","已确认",""],
 ["TS_IF_011","ts2router_credit_release_ch","t2r_credit_release_uid/valid","O","16/1","返回握手","valid-only","退休时脉冲","普通用户退休通知Router","TS-FUNC-011,TS-FUNC-014","SRC_014（2.2,4.1.4）","已确认",""],
 ["TS_IF_012","ts2dtecore_task_ch","uid/tid/streamid/pid/pc/vcid","O","16/6/4/8/32/2","请求数据","见各字段定义","valid保持期间稳定","DTE任务命令payload","TS-FUNC-008","SRC_014（2.2,4.1.2.1）","已确认",""],
 ["TS_IF_013","ts2dtecore_task_ch","task_valid/task_ready","O/I","1/1","请求握手","valid-ready","valid&&ready","DTE接受任务；不表示完成","TS-FUNC-008","SRC_014（2.2,4.1.2.1）","已确认",""],
 ["TS_IF_014","dtecore2ts_done_ch","uid/tid/sid/pid/valid","I","16/6/4/8/1","返回数据","valid-only","每个valid周期一笔","DTE Core完成ACK；PID更新任务可携新PID","TS-FUNC-009,TS-FUNC-016","SRC_014（2.2,4.1.2.1）","已确认",""],
 ["TS_IF_015","dte2ts_done_ch","uid/tid/sid/valid","I","16/6/4/1","返回数据","valid-only","每个valid周期一笔","DTE DSA完成ACK","TS-FUNC-009","SRC_014（2.2）","已确认",""],
 ["TS_IF_016","ts2mucore_task_ch","uid/tid/streamid/pid/pc/vcid/valid/ready","O/O/O/O/O/O/O/I","16/6/4/8/32/2/1/1","请求握手","valid-ready","valid&&ready","MU任务下发","TS-FUNC-008","SRC_014（2.2,4.1.2.1）","已确认",""],
 ["TS_IF_017","mucore2ts_done_ch","uid/tid/sid/pid/valid","I","16/6/4/8/1","返回数据","valid-only","每个valid周期一笔","MU Core完成ACK","TS-FUNC-009,TS-FUNC-016","SRC_014（2.2）","已确认",""],
 ["TS_IF_018","mu2ts_done_ch","uid/tid/sid/valid","I","16/6/4/1","返回数据","valid-only","每个valid周期一笔","MU DSA完成ACK","TS-FUNC-009","SRC_014（2.2）","已确认",""],
 ["TS_IF_019","ts2vucore_task_ch","uid/tid/streamid/pid/pc/vcid/valid/ready","O/O/O/O/O/O/O/I","16/6/4/8/32/2/1/1","请求握手","valid-ready","valid&&ready","VU任务下发","TS-FUNC-008","SRC_014（2.2,4.1.2.1）","已确认",""],
 ["TS_IF_020","vucore2ts_done_ch","uid/tid/sid/pid/valid","I","16/6/4/8/1","返回数据","valid-only","每个valid周期一笔","VU Core完成ACK","TS-FUNC-009,TS-FUNC-016","SRC_014（2.2）","已确认",""],
 ["TS_IF_021","vu2ts_done_ch","uid/tid/sid/valid","I","16/6/4/1","返回数据","valid-only","每个valid周期一笔","VU DSA完成ACK","TS-FUNC-009","SRC_014（2.2）","已确认",""],
];

const tsExampleRows=[
 ["TS_EX_001","普通任务链配置提交","TS-FUNC-001,TS-FUNC-002","CONFIG状态","依次写TASK_CHAIN PC/ATTR；STREAM_NUM；ROUTER_TABLE；SELF_START=0；TS_INIT_FINISH=1","读取TS_STATE","配置合法后进入ACTIVE并推送Task0","是","SRC_013（5.5.1）,SRC_014（2.4.3,4.1.3,5.5.1）","已确认",""],
 ["TS_EX_002","配置错误修复重提","TS-FUNC-002,TS-ERR-001","TS_STATE.ERROR=1","先写FINISH=0；修正配置；再写FINISH=1","读取TS_STATE","已有表项保留，重新检查；错误不通过PSLVERR报告","是","SRC_014（4.1.3）","已确认",""],
 ["TS_EX_003","权重加载","TS-FUNC-001","业务任务链提交前","写DATAIN_TASK_PC；写ATTR.weights_loading=1","等待Router Trigger；完成后软件清weights_loading","产生一笔PC-only DTE请求；不创建Stream","是","SRC_013（5.5.2）,SRC_014（4.1.3,5.5.2）","已确认",""],
 ["TS_EX_004","SELF_START启动与重生","TS-FUNC-015","B/R Core模式","配置Task0、DataIn PC/ATTR、STREAM_NUM、SELF_START=1并提交","首个Router Trigger；Task0 Core ACK补UID","激活全部启用槽位；退休后匿名Task0重生","是","SRC_013（5.5.2）,SRC_014（2.4.3,5.5.3）","已确认",""],
 ["TS_EX_005","Broadcast/P2P Reissue配置","TS-FUNC-006,TS-FUNC-010,TS-FUNC-012","partner TID已完整配置","配置DataIn type=2/3、wait_wake=1、partner TID；DataOut type=1且credit_en=1","Router Trigger携reissue","reissue决定执行或Skip配对任务","是","SRC_014（2.4.3.1,5.3）","已确认",""],
];

const tsFeatureText=[
 ["TS-FUNC-001","正向功能","初始化、软件配置与权重加载","CONFIG/weights_loading","DATAIN_TASK,TS_INIT_FINISH","TS_IF_003~008","APB配置；权重加载仍需Router Trigger","配置提交结果或DTE PC-only请求","","scp_ctrl2ts_cfg_legal_001"],
 ["TS-FUNC-002","约束/合法性","Task Chain配置与合法性检查","提交TS_INIT_FINISH","TASK_CHAIN,STREAM_NUM,TS_STATE","TS_IF_003~006","最多64任务；检查连续性、End、编码及配对","TS_STATE.ERROR","","scp_ctrl2ts_cfg_legal_001"],
 ["TS-FUNC-003","正向功能","Stream运行态管理","ACTIVE","STREAM_NUM","TS_IF_007~021","最多16个Stream，合并同拍完成","运行态状态更新","最多16用户",""] ,
 ["TS-FUNC-004","对象关系","UID匹配、建槽与复用","Router Trigger","","TS_IF_007~008","UID命中复用，未命中新建","Stream分配结果","",""] ,
 ["TS-FUNC-005","对象关系","DataIn与PID匹配","DataIn请求","TASK_PATH_ID","TS_IF_007~008","选择PID匹配且未完成/未领取的最低TID","候选任务","",""] ,
 ["TS-FUNC-006","正向功能","任务Skip管理","Broadcast/P2P","TASK_TYPE,PARTNER_TID","TS_IF_007~008","按reissue生成Skip位图","完成位更新","",""] ,
 ["TS-FUNC-007","正向功能","任务推进与后继生成","当前任务完成","TASK_CHAIN","TS_IF_014~021","16路TG生成后继并安装","后继状态更新","16路并行",""] ,
 ["TS-FUNC-008","正向功能","就绪任务仲裁与下发","任务READY","TASK_SEND_UNIT","TS_IF_012~013,TS_IF_016,TS_IF_019","DTE/MU/VU独立按最老用户仲裁，反压保持","Core接受任务","3类任务可并行",""] ,
 ["TS-FUNC-009","对象关系","ACK解析与任务完成","Core/DSA ACK","TASK_RECV_UNIT","TS_IF_014~021","Core-only、DSA-only或双ACK顺序配对","Completion更新","每侧16笔未配对",""] ,
 ["TS-FUNC-010","正向功能","P2P Reissue","P2P DataIn","TASK_TYPE,PARTNER_TID","TS_IF_007~008","reissue=1执行；0跳过搬入及配对搬出","Candidate或Skip","",""] ,
 ["TS-FUNC-011","输出结果","用户Credit归还","普通用户退休","","TS_IF_011","输出UID及valid，无ready","Router收到释放通知","",""] ,
 ["TS-FUNC-012","正向功能","Broadcast Reissue","Broadcast DataIn","TASK_TYPE,PARTNER_TID","TS_IF_007~008","reissue=0保留搬入、跳过搬出；1均执行","Candidate/Skip","",""] ,
 ["TS-FUNC-013","对象关系","Reduce与RMEM许可管理","type=4","TASK_TYPE","TS_IF_010","每SID独立RMEM；完成与归还是不同事件","REDUCE_WAIT/READY/退休","16份RMEM",""] ,
 ["TS-FUNC-014","正向功能","Stream退休与槽位复用","through-End完成且RMEM归还","","TS_IF_011","仅Head退休；普通释放，自启动重生","槽位释放或重生","",""] ,
 ["TS-FUNC-015","正向功能","SELF_START特殊模式","SELF_START=1","SELF_START,DATAIN_TASK","TS_IF_007~008,TS_IF_012~021","首Trigger激活槽位；Task0 ACK补UID","匿名Task0运行/重生","",""] ,
 ["TS-FUNC-016","对象关系","运行时PID更新与继承","type=5 Core-only ACK","TASK_TYPE,TASK_PATH_ID","TS_IF_014,TS_IF_017,TS_IF_020","仅紧邻后继继承新PID","后继PID/VCID更新","",""] ,
 ["TS-FUNC-017","对象关系","Router Table与VCID透传","PID有效","ROUTER_TABLE","TS_IF_012,TS_IF_016,TS_IF_019","64项PID映射方向与VCID","命令PID/VCID","",""] ,
 ["TS-FUNC-018","正向功能","普通方向Credit分配与归还","credit_en=1","TASK_CREDIT_EN,ROUTER_TABLE","TS_IF_009","三个方向整体授权；归还下一周期可用","WAIT_CREDIT→READY","每拍最多许可1用户",""] ,
 ["TS-CONSTR-001","约束/合法性","APB配置访问约束","APB访问","全部MMIO","TS_IF_003~006","4B对齐；只读不可写；未映射非法","合法访问完成","零等待","scp_ctrl2ts_cfg_legal_001"],
 ["TS-ERR-001","错误处理","APB与业务配置错误分层","APB/提交配置","TS_STATE,TS_INIT_FINISH","TS_IF_006","传输错误用PSLVERR；业务配置错误用TS_STATE","pslverr或ERROR状态","","scp_ctrl2ts_cfg_legal_001"],
 ["TS-PERF-001","性能","Task唤醒延迟","无反压无冲突","","TS_IF_012~021","满足时序条件下完成唤醒下发","task_valid","2~3 cycle",""] ,
 ["TS-PERF-002","性能","Task发射宽度","不同类型且不同用户","","TS_IF_012~021","DTE/MU/VU三路独立并行下发","三路valid可同拍","3 tasks",""] ,
 ["TS-PERF-003","性能","DTE任务仲裁","DTE候选竞争","","TS_IF_012~013","Reissue/DataIn/Task Chain统一按最老用户原则","最老候选获选","",""] ,
];
const tsFeatureRows=tsFeatureText.map((r,i)=>[...r,"SRC_014（1.1,2.4,4,5）"+(r[0].startsWith("TS-PERF")?",SRC_013（1.2.2）":""),"已确认",""]);
for(const r of paths)if(r[1]==="scp_ctrl2ts_cfg_legal_001"){r[12]="TS-FUNC-001,TS-FUNC-002,TS-CONSTR-001,TS-ERR-001";r[13]="SRC_003,SRC_013,SRC_014,SRC_015,SRC_016";r[14]="已确认";r[15]="";}

const dteMmioRows=[
 ["DTE_REG_001","CFG_TRIGGER","1","0x4802_8000（offset 0x0000）","32","temp_valid/temp_index","0/3:1","W",0,"valid=1；index=0~7","提交指定Template配置","触发配置快照","DTE-FUNC-001","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_002","CFG_ADDR_SRC_xx","4（xx=0~3）","0x4802_8004+8*xx（offset 0x0004+8*xx）","32","source_addr","31:0","R/W",0,"32-bit地址","四个Segment源地址","","DTE-FUNC-002","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_003","CFG_ADDR_DST_xx","4（xx=0~3）","0x4802_8008+8*xx（offset 0x0008+8*xx）","32","destination_addr","31:0","R/W",0,"32-bit地址","四个Segment目的地址","","DTE-FUNC-002","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_004","CFG_STRIDE_xx","4（xx=0~3）","0x4802_8024+4*xx（offset 0x0024+4*xx）","32","stride","31:0","R/W",0,"32-bit","按SID计算地址增量","","DTE-FUNC-002","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_005","CFG_DATA_LEN_xx","4（xx=0~3）","0x4802_8034+4*xx（offset 0x0034+4*xx）","32","length","31:0","R/W",0,"Segment0=32B；其它为8B整数倍","各Segment长度","非法长度产生配置错误","DTE-CONSTR-001","SRC_017（5）,SRC_018（2.3,3）","已确认",""],
 ["DTE_REG_006","CFG_SM_W_ADDR","1","0x4802_8044（offset 0x0044）","32","sharemem_addr","31:0","R/W",0,"32-bit","任务完成标志写地址","","DTE-FUNC-006","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_007","CFG_SM_W_DATA","1","0x4802_8048（offset 0x0048）","32","sharemem_data","31:0","R/W",0,"32-bit","任务完成标志写数据","","DTE-FUNC-006","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_008","CFG_TRANS_MODE","1","0x4802_804C（offset 0x004C）","32","transfer_mode","9:7","R/W",0,"000 R2C;001 R2M;010 C2R;011 M2R;100内部搬运","选择搬运方向","其它编码非法","DTE-FUNC-003,DTE-FUNC-004,DTE-FUNC-005","SRC_017（5）,SRC_018（2.3,3）","已确认",""],
 ["DTE_REG_009","CFG_TRANS_MODE","1","0x4802_804C（offset 0x004C）","32","seg_valid","6:4","R/W",0,"bit对应Segment1~3；Segment0常有效","选择附加Segment","","DTE-FUNC-002","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_010","CFG_TRANS_MODE","1","0x4802_804C（offset 0x004C）","32","hw_header_op","2","R/W",0,"0/1","硬件Header操作控制","","DTE-FUNC-007","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_011","CFG_TRANS_MODE","1","0x4802_804C（offset 0x004C）","32","wr_sharemem_flag","1","R/W",0,"0/1","完成时写ShareMem标志","","DTE-FUNC-006","SRC_017（5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_012","CFG_TRANS_MODE","1","0x4802_804C（offset 0x004C）","32","ack_ts_en","0","R/W",0,"0/1","正常完成时向TS返回ACK","异常任务不回ACK","DTE-FUNC-008,DTE-ERR-001","SRC_017（5）,SRC_018（2.3,3）","已确认",""],
 ["DTE_REG_013","SYS_CTRL","1","Ctrl Status域：0x4802_8400~0x4802_87FF","32","stop/resume/cancel/step/flush","TBD","R/W","TBD","控制位定义待定稿","调试与恢复控制","","DTE-DBG-001","SRC_017（5）,SRC_018（2.3）","待确认","Q_005"],
 ["DTE_REG_014","SYS_STATUS","1","Ctrl Status域：0x4802_8400~0x4802_87FF","32","状态/错误字段","TBD","R","0x0008_0800","字段位置部分待定稿","状态与错误观测","","DTE-DBG-001,DTE-ERR-001","SRC_017（5）,SRC_018（2.3）","待确认","Q_005"],
 ["DTE_REG_015","PMU_COUNTER_xx","8","0x4802_8800~0x4802_8BFF（offset 0x0800~0x0BFF）","32","counter/event","TBD","R","0","事件计数","性能与调试观测","","DTE-PERF-002","SRC_017（5,6）,SRC_018（2.3）","待确认","Q_007"],
 ["DTE_REG_016","CONFIG_TEMPLATE_xx","8（xx=0~7）","0x4802_9000+0x80*xx（offset 0x1000+0x80*xx）","1024","template","全项","R/W",0,"每项128B","任务配置模板","触发后复制到TaskQ","DTE-FUNC-001","SRC_017（2.1,5）,SRC_018（2.3）","已确认",""],
 ["DTE_REG_017","TASKQ_ENTRY_xx","16（xx=0~15）","0x4802_A000~0x4802_AFFF（offset 0x2000~0x2FFF）","TBD","task entry","TBD","R","TBD","16项","硬件任务队列观测域","","DTE-FUNC-009","SRC_017（2.1,5）,SRC_018（2.3）","待确认","Q_007"],
 ["DTE_REG_018","HEADER_TABLE_xx","16（xx=0~15）","0x4802_B000+0x40*xx（offset 0x3000+0x40*xx）","400","header","399:0","R/W","无复位（已确认）","每项50B，占64B槽位","DTE Header表","","DTE-FUNC-007","SRC_017（2.1,5）,SRC_018（2.3）","已确认",""]
];
const dteInterfaceRows=[
 ["DTE_IF_001","cfg_noc","psel/penable/pwrite/paddr/pwdata/prdata/pready/pslverr","I/I/I/I/I/O/O/O","1/1/1/32/32/32/1/1","MMIO配置","APB3","APB Access","配置、状态、性能与Debug访问","DTE-FUNC-001,DTE-ERR-001","SRC_018（2.2,5）,SRC_006","已确认",""],
 ["DTE_IF_002","rvcore2dsa","req_valid/req_ready/rw_type/addr/wdata","I/O/I/I/I","1/1/1/32/32","请求握手/数据","valid-ready","valid&&ready；反压时payload稳定","RV Core寄存器访问请求","DTE-FUNC-010","SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_003","rvcore2dsa","sid/uid/tid/pid/vcid","I","4/16/6/8/2","请求参数","STUPV","随请求有效","请求上下文信息","DTE-FUNC-010","SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_004","dsa2rvcore","rd_rsp/rd_data","O","1/32","返回数据","valid-only；无ID","按请求顺序返回","寄存器读响应","DTE-FUNC-010","SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_005","dte2ts_done","uid/tid/sid/valid","O","16/6/4/1","完成通知","valid-only","ack_ts_en且任务正常完成","按任务顺序向TS反馈完成","DTE-FUNC-008","SRC_017（1.2,3,4）,SRC_018（2.2,5,6）","已确认",""],
 ["DTE_IF_006","router_rx","header/ext/payload/valid/ready","I/I/I/I/O","256/160/2048/1/1","输入数据流","valid-ready","valid&&ready","Router输入：32B Header+20B扩展+256B payload","DTE-FUNC-003","SRC_017（1.2,3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_007","router_tx","header/ext/payload/valid/ready","O/O/O/O/I","256/160/2048/1/1","输出数据流","valid-ready；VC在Header[19:18]","valid&&ready","DTE向Router发送数据包","DTE-FUNC-004","SRC_017（1.2,3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_008","router_credit","vc0~vc3 credit","I/O","按VC","流控","credit","credit可用才发包","四个输出VC的Credit管理","DTE-PERF-002","SRC_017（1.2,3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_009","dte2cm","rd/wr req, addr, data, mask, rsp, ecc","O/O/O/O/O/I/I","2lane×128B；addr14×2","存储器读写","请求/响应配对","请求有效至接收；响应按接口定义","CoreMem双lane访问","DTE-FUNC-003,DTE-FUNC-004,DTE-FUNC-005","SRC_017（1.2,3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_010","dte2mm_mu","sel, rd/wr req, addr, data, mask, rsp, ecc","O/O/O/O/O/O/I/I","sel1；2lane×128B；addr19×2","共享存储器读写","sel=0 Mmem；sel=1 MU TopK","请求/响应配对","Mmem与MU TopK共享物理接口","DTE-FUNC-003,DTE-FUNC-004,DTE-FUNC-005,DTE-FUNC-011","SRC_017（1.2,3）,SRC_018（2.2,5）","已确认",""],
 ["DTE_IF_011","dte2sharemem","wr_req/addr/data/rsp","O/O/O/I","1/32/1024/1","完成标志写","请求/响应","wr_sharemem_flag有效","向ShareMem写128B数据通道，配置数据为低32bit","DTE-FUNC-006","SRC_017（1.2,3）,SRC_018（2.2,5）","已确认",""]
];
const dteExampleRows=[
 ["DTE_EX_001","Router→CoreMem","DTE-FUNC-001,DTE-FUNC-002,DTE-FUNC-003","模板已配置","设置源/目的地址、长度、transfer_mode=000并触发","TS下发任务；Router输入数据包","数据写入CoreMem，按配置产生完成动作","是","SRC_017（9.1）,SRC_018（3,6）","已确认",""],
 ["DTE_EX_002","Router→MatrixMem","DTE-FUNC-001,DTE-FUNC-002,DTE-FUNC-003","模板已配置","transfer_mode=001","Router输入数据包","数据通过dte2mm_mu且sel=0写入Mmem","是","SRC_017（4,9.1）,SRC_018（3,6）","已确认",""],
 ["DTE_EX_003","CoreMem→Router","DTE-FUNC-002,DTE-FUNC-004,DTE-FUNC-007","Header配置有效","transfer_mode=010；选择Segment","读取CoreMem并申请Router Credit","按Header/VC打包并发送至Router","是","SRC_017（4,9.1）,SRC_018（3,6）","已确认",""],
 ["DTE_EX_004","MatrixMem→CoreMem","DTE-FUNC-002,DTE-FUNC-005","源/目的地址8B对齐","transfer_mode=100","读取Mmem并写CoreMem","完成内部搬运；ST不观察lane内部调度","是","SRC_017（1.2,4）,SRC_018（3,6）","已确认",""],
 ["DTE_EX_005","MU TopK共享接口访问","DTE-FUNC-011,MU-FUNC-003","TopK已由外部准备完成","由任务产生dte2mm_mu访问","sel=1；stream entry index=0~15；整项256B通过双路128B同拍访问","访问MU TopK而非Mmem；MU内部完成紧凑传输与CSR布局转换","是","SRC_017（3,4）,SRC_018（2.2,5）,SRC_019（5.2.7）,SRC_020（3,7）","已确认",""]
];
const dteFeatureRows=[
 ["DTE-FUNC-001","正向功能","配置模板与触发","合法Template索引","CFG_TRIGGER,CONFIG_TEMPLATE","DTE_IF_001","8个128B模板；触发后快照到任务项","配置进入TaskQ","","scp_ctrl2dte_dsa_cfg","SRC_017（2.1,5）,SRC_018（2.3,3）","已确认",""],
 ["DTE-FUNC-002","对象关系","多Segment地址与长度","任务配置有效","CFG_ADDR/STRIDE/LEN,CFG_TRANS_MODE","","Segment0常有效，1~3按seg_valid；地址按SID×stride计算","形成搬运描述","","","SRC_017（4,5）,SRC_018（2.3,3）","已确认",""],
 ["DTE-FUNC-003","正向功能","Router输入至存储器","mode=000/001","CFG_TRANS_MODE","DTE_IF_006,DTE_IF_009,DTE_IF_010","接收Router包并写CoreMem或Mmem","目标存储器写请求/响应","256B payload","DTE_DSA→CORE_MEM,DTE_DSA→MATRIX_MEM","SRC_017（1.2,4）,SRC_018（3,6）","已确认",""],
 ["DTE-FUNC-004","正向功能","存储器输出至Router","mode=010/011","CFG_TRANS_MODE,HEADER_TABLE","DTE_IF_007~010","读取CoreMem/Mmem并按Header与VC发包","Router TX握手","256B payload","DTE_DSA→CORE_MEM,DTE_DSA→MATRIX_MEM","SRC_017（1.2,4）,SRC_018（3,6）","已确认",""],
 ["DTE-FUNC-005","正向功能","核内存储搬运","mode=100","CFG_TRANS_MODE","DTE_IF_009~010","Mmem→Cmem或Cmem→Header Table；ST只观察端到端结果","目标写入/表项更新","","DTE_DSA→CORE_MEM,DTE_DSA→MATRIX_MEM","SRC_017（1.2,4）,SRC_018（3,6）","已确认",""],
 ["DTE-FUNC-006","输出结果","ShareMem完成标志","wr_sharemem_flag=1","CFG_SM_W_ADDR/DATA,CFG_TRANS_MODE","DTE_IF_011","任务完成后写ShareMem","ShareMem写响应","低32bit配置数据","DTE_DSA→SHARE_MEM","SRC_017（1.2,4,5）,SRC_018（2.3,3,6）","已确认",""],
 ["DTE-FUNC-007","对象关系","Header生成与表项","输出Router或内部Header操作","HEADER_TABLE,CFG_TRANS_MODE","DTE_IF_006~007","32B Header并支持20B扩展；VC由Header选择","输出Header或更新Header表","16项×50B","","SRC_017（1.2,2.1,4,5）,SRC_018（2.3,3）","已确认",""],
 ["DTE-FUNC-008","输出结果","TS完成反馈","ack_ts_en=1且正常完成","CFG_TRANS_MODE","DTE_IF_005","多物理通道可乱序执行，但向TS按任务顺序反馈","uid/tid/sid/valid","","","SRC_017（1.2,4）,SRC_018（3,6）","已确认",""],
 ["DTE-FUNC-009","正向功能","TaskQ管理","配置触发且有空项","TASKQ_ENTRY","DTE_IF_005~011","TaskQ最多16项；跨通道可并行","完成后释放队列项","16 entries","","SRC_017（1.2,2.1,4）,SRC_018（3,6）","已确认",""],
 ["DTE-FUNC-010","正向功能","RV Core寄存器访问","合法地址与操作","","DTE_IF_002~004","请求支持反压；读返回无ID并保持顺序","读数据valid","32-bit","RVCORE→DTE","SRC_017（3）,SRC_018（2.2,5）","已确认",""],
 ["DTE-FUNC-011","对象关系","Mmem/MU共享接口选择","访问Mmem或TopK","","DTE_IF_010","sel=0访问Mmem；sel=1访问MU TopK；TopK按16个stream entry索引，整项256B由双路128B同拍访问","对应目标请求/响应","2×128B","DTE_DSA→MATRIX_MEM,DTE_DSA→MU_TOPK","SRC_017（3,4）,SRC_018（2.2,5）,SRC_019（5.2.7）,SRC_020（3,7）","已确认",""],
 ["DTE-CONSTR-001","约束/合法性","地址与长度约束","所有Segment","CFG_ADDR,CFG_DATA_LEN","DTE_IF_006~010","地址8B对齐；Segment0=32B；其它长度为8B整数倍","合法任务或配置错误","","","SRC_017（1.2,4）,SRC_018（3,7）","已确认",""],
 ["DTE-CONSTR-002","约束/合法性","接口稳定与顺序","valid/ready接口反压","","DTE_IF_002,DTE_IF_006~010","valid且未ready时payload稳定；RV读返回按序","协议行为满足","","","SRC_017（3,4）,SRC_018（5,7）","已确认",""],
 ["DTE-ERR-001","错误处理","错误分类、Drain与恢复","对齐/方向/ECC/接口错误","SYS_STATUS","DTE_IF_001,DTE_IF_005,DTE_IF_009~011","错误任务不回TS正常ACK；停止发起新请求，排空在途并等待恢复控制","错误状态可观测","","","SRC_017（4,5）,SRC_018（3,6,7）","待确认","Q_006"],
 ["DTE-PERF-001","性能","数据通路宽度","正常搬运","","DTE_IF_006~011","Router/Cmem/Mmem/MU为256B级；ShareMem写128B","接口吞吐可观测","按接口宽度","","SRC_017（1.2,6）,SRC_018（2.2）","已确认",""],
 ["DTE-PERF-002","性能","并发、缓冲与Outstanding","多任务多通道","PMU_COUNTER","DTE_IF_008~011","TaskQ 16；通道Buffer 8KB；接口支持Outstanding","计数器/吞吐/反压","精确Outstanding深度待确认","","SRC_017（1.2,2.1,6）,SRC_018（2.3,7）","待确认","Q_007"],
 ["DTE-DBG-001","Debug","Stop/Resume/Cancel/Step与状态","调试控制","SYS_CTRL,SYS_STATUS","DTE_IF_001","支持停止、恢复、取消、单步及状态观测；最终位定义待确认","控制效果/状态","","","SRC_017（1.2,5）,SRC_018（2.3,3）","待确认","Q_005"]
];
const muMmioRows=[
 ["MU_REG_001","CFG_TRIGGER","1","0x4803_0000（offset 0x0000）","32","template_id/trigger","见文档","W",0,"Template 0~3","原子提交动态配置并入TaskQ","TaskQ满时反压","MU-FUNC-001","SRC_019（5.2.1）,SRC_020（4.3,5.2）","已确认",""],
 ["MU_REG_002","TASK_CONFIG","连续寄存器组","0x4803_0004~0x4803_03FF（offset 0x0004~0x03FF）","32","地址/维度/stride/precision/primitive_mode","见文档","R/W",0,"按字段定义","矩阵任务动态配置","Trigger时快照","MU-FUNC-001,MU-FUNC-002","SRC_019（5.2.1,5.6,5.7）,SRC_020（4,5.2,8）","已确认",""],
 ["MU_REG_003","MU_CTRL","1","0x4803_0400~0x4803_07FF域内（offset 0x0400~0x07FF）","32","stop/step/resume/cancel/clear_error/clear_all","见文档","R/W",0,"控制命令","运行与恢复控制","命令影响TaskQ/在途请求","MU-DBG-001,MU-ERR-001","SRC_019（5.2.2,5.3）,SRC_020（15,16）","已确认",""],
 ["MU_REG_004","MU_STATUS/MU_ERR_INFO","状态寄存器组","0x4803_0400~0x4803_07FF域内（offset 0x0400~0x07FF）","32","state/taskQ/error address/type","见文档","R",0,"Idle/Busy/Err_Drain/Error/Stop/Stopping","状态、队列和首个错误信息","clear_error按报告顺序清除","MU-ERR-001,MU-DBG-001","SRC_019（5.2.2,5.3）,SRC_020（15,16）","已确认",""],
 ["MU_REG_005","PROFILE_COUNTER","计数器组","0x4803_0800~0x4803_0BFF（offset 0x0800~0x0BFF）","32/64","task/primitive/busy/CM读写","见文档","R",0,"计数值","性能观测","","MU-PERF-002","SRC_019（1.2.1,5.2.3,6.2）,SRC_020（18）","已确认",""],
 ["MU_REG_006","DEBUG","寄存器组","0x4803_0C00~0x4803_0FFF（offset 0x0C00~0x0FFF）","32","debug fields","见文档","R/W",0,"按字段定义","Debug观测与控制","","MU-DBG-001","SRC_019（5.2.4）,SRC_020（16）","已确认",""],
 ["MU_REG_007","CONFIG_TEMPLATE_xx","4（xx=0~3）","0x4803_1000+0x80*xx（offset 0x1000+0x80*xx）","1024","template","全项","R/W",0,"每项128B","静态任务模板","","MU-FUNC-001","SRC_019（1.2.2,5.2.5）,SRC_020（5）","已确认",""],
 ["MU_REG_008","TASKQ_ENTRY_xx","8（xx=0~7）","0x4803_2000~0x4803_2FFF（offset 0x2000~0x2FFF）","TBD","task entry","见文档","R",0,"8项","任务队列观测","","MU-FUNC-006","SRC_019（1.2.1,5.2.6）,SRC_020（5.4,6）","已确认",""],
 ["MU_REG_009","TOPK_TABLE","16（stream_id=0~15）","0x4803_3000+0x100*stream_id（offset 0x3000+0x100*stream_id）","2048/entry","ep_counter/local_ep_index/W_ep","16b；32×2B；32×4B（W_ep从entry+0x80起）","R/W",0,"每项256B；最多32个route专家；shared专家最多8个","DTE紧凑格式与CSR布局由mu_topk_table内部转换","外部保证TopK已就绪；MU不等待ready且不管理版本","MU-FUNC-003","SRC_019（5.2.7）,SRC_020（7）","已确认",""]
];
const muInterfaceRows=[
 ["MU_IF_001","cfg_noc","PADDR/PSEL/PENABLE/PWRITE/PWDATA/PREADY/PRDATA/PSLVERR","I/I/I/I/I/O/O/O","32/1/1/1/32/1/32/1","MMIO配置","APB3；32-bit","Access阶段","Ctrl-NOC访问MU寄存器/表","MU-FUNC-001,MU-ERR-001","SRC_019（3.1,3.2.2）","已确认",""],
 ["MU_IF_002","rvcore2mu","req_valid/ready/type/addr/wdata + sid/tid/uid","I/O/I/I/I + I","1/1/1/32/32 + 4/6/16","请求握手/参数","valid-ready","valid&&ready；反压时稳定","RV Core配置与Trigger；读响应无ID且按序","MU-FUNC-001","SRC_019（3.1）","已确认",""],
 ["MU_IF_003","mu2ts_done","uid/tid/sid/valid","O","16/6/4/1","完成通知","valid-only","task_last任务完成","按TaskQ顺序反馈TS","MU-FUNC-007","SRC_019（1.2.1,3.1）","已确认",""],
 ["MU_IF_004","mu2cm_rd","req/ready/scale_en/addr/rsp/data/ecc","O/I/O/O/I/I/I","双路；addr13×2；data1056×2","CoreMem读","双路同步","一次读取256B data及scale；128B颗粒","token输入读取","MU-FUNC-004,MU-ERR-001","SRC_019（1.2.1,3.1）","已确认",""],
 ["MU_IF_005","mu2cm_wr","valid/addr/mask/data","O","双路；addr13×2；mask128×2；data1024×2","CoreMem写","无反压/无Bresp","请求有效","输出结果写入CoreMem","MU-FUNC-004","SRC_019（1.2.1,3.1,6）","已确认",""],
 ["MU_IF_006","mu2mm_rd","req/ready/addr/data/scale/ecc","O/I/O/I/I/I","64 lane×128B data；最大16B scale/lane","MatrixMem读","请求与固定延迟返回","按128B行地址读取weight","weight与scale输入","MU-FUNC-005,MU-ERR-001","SRC_019（1.2.1,3.1,6）","已确认",""],
 ["MU_IF_007","dte2mm_mu","sel/read/write/addr/data/mask/rsp/ecc","I/O","sel=1；双路128B","TopK共享接口","sel=1选择MU TopK；地址为stream entry index 0~15","请求/响应配对；整项256B由双路128B同拍访问","DTE读写TopK；与Mmem共享物理接口；内部转换紧凑格式与CSR布局","MU-FUNC-003","SRC_019（3.1,5.2.7）,SRC_020（3,7）","已确认",""]
];
const muExampleRows=[
 ["MU_EX_001","普通矩阵乘","MU-FUNC-001,MU-FUNC-002,MU-FUNC-004,MU-FUNC-005","模板与地址有效","选择精度/primitive；配置A/B/C地址与K/N；Trigger","读取CM token与MM weight","完成C=A*B并写回CM","是","SRC_019（9.1 示例1）","已确认",""],
 ["MU_EX_002","多专家GEMV","MU-FUNC-002,MU-FUNC-003","topK表与专家weight有效","配置share/route专家、stride与precision","按stream索引topK并读取专家weight","分别输出专家结果","是","SRC_019（9.1 示例2/3）","已确认",""],
 ["MU_EX_003","专家间Reduce","MU-FUNC-002,MU-FUNC-003","多专家token/weight对应","启用W_ep与专家归约","读取topK的local_ep_index/W_ep","FP32中间归约后按配置精度写回","是","SRC_019（9.1 示例5）","已确认",""]
];
const muFeatureRows=[
 ["MU-FUNC-001","正向功能","模板配置与原子Trigger","合法Template/TaskQ有空间","CFG_TRIGGER,TASK_CONFIG,CONFIG_TEMPLATE","MU_IF_001~002","动态配置在Trigger时原子快照；4组模板","任务入TaskQ","","SCP_CTRL→MU_CFG,RVCORE→MU","SRC_019（3,5）,SRC_020（4,5）","已确认",""],
 ["MU-FUNC-002","正向功能","矩阵与多专家计算","K/N与precision合法","TASK_CONFIG","MU_IF_004~006","支持C=A*B和C=(A*B)*W_ep；不加载初始C","结果写回CM","W16/W8/W4与BF16/MXFP8/NVFP4组合","MU_DSA→CORE_MEM,MU_DSA→MATRIX_MEM","SRC_019（1.2.1,5.6,5.7）","已确认",""],
 ["MU-FUNC-003","对象关系","TopK与专家解析","TopK由外部准备完成；stream_id=0~15","TOPK_TABLE","MU_IF_007","16个256B stream entry；每项最多32个route专家；local_ep_index×stride生成weight偏移；DTE紧凑传输长度=2B+router_ep_count×(2B+4B)","选中专家与权重","整项256B；双路128B同拍","DTE_DSA→MU_TOPK","SRC_019（5.2.7）,SRC_020（7）","已确认",""],
 ["MU-FUNC-004","正向功能","CoreMem token/结果通路","地址和长度合法","TASK_CONFIG","MU_IF_004~005","读token、写output；8B对齐；CM写无Bresp","CM数据变化/ECC","读写256B/T","MU_DSA→CORE_MEM","SRC_019（1.2.1,3,6）","已确认",""],
 ["MU-FUNC-005","正向功能","MatrixMem weight通路","weight地址合法","TASK_CONFIG","MU_IF_006","从MatrixMem读取weight与scale","MM请求/返回/ECC","总读8KB data+1KB scale","MU_DSA→MATRIX_MEM","SRC_019（1.2.1,3,6）","已确认",""],
 ["MU-FUNC-006","正向功能","TaskQ顺序执行","队列未满","TASKQ_ENTRY","MU_IF_003~006","TaskQ深度8；本版任务串行、内部读算写可重叠","任务顺序完成","8 entries","","SRC_019（1.2.1,1.2.2,5.2.6）","已确认",""],
 ["MU-FUNC-007","输出结果","TS完成反馈","task_last=1","","MU_IF_003","仅task_last任务通知TS，按TaskQ顺序反馈","uid/tid/sid/valid","","","SRC_019（1.2.1,3）","已确认",""],
 ["MU-CONSTR-001","约束/合法性","任务参数、地址和精度约束","所有任务","TASK_CONFIG","MU_IF_004~006","tile不小于primitive；地址8B对齐；模式组合必须受支持","合法执行或配置错误","","","SRC_019（1.2.1,5.7,5.8）,SRC_020（8,13）","已确认",""],
 ["MU-ERR-001","错误处理","错误记录与顺序报告","配置/地址/ECC/bus/数值错误","MU_CTRL,MU_STATUS/MU_ERR_INFO","MU_IF_001,004~007","错误队头阻塞退休；后续合法任务可执行；clear_error只清当前报告；clear_all/cancel排空","错误地址/类型与通知","","","SRC_019（1.2.1,5.3）,SRC_020（15）","已确认",""],
 ["MU-DBG-001","Debug","Stop/Step/Resume/Cancel","调试命令","MU_CTRL,MU_STATUS,DEBUG","MU_IF_001","以TaskQ任务为粒度控制并观察六态","状态变化","","","SRC_019（1.2.1,5.4）,SRC_020（16）","已确认",""],
 ["MU-PERF-001","性能","计算与存储吞吐","数据/算术/写回无瓶颈","","MU_IF_004~006","primitive稳态目标每拍一次；K=64的1×64×128利用率损失50%","吞吐与带宽","4K/8K/16K MAC按精度","","SRC_019（1.2.1,1.2.2,6）","已确认",""],
 ["MU-PERF-002","性能","性能计数","profile开启","PROFILE_COUNTER","MU_IF_004~006","统计task、primitive、busy及CM读写有效拍","计数器可读","","","SRC_019（1.2.1,6.2）","已确认",""]
];

const vuMmioRows=[
 ["VU_REG_001","macro_inst_trigger","1","0x4804_0000（offset 0x0000）","32","CONFIG_IDX/MASK/EVENT_EN/STREAM/FENCE","见文档","W",0,"8组模板；stream 0~15","一次写入即发射宏指令","ISQ满时反压","VU-FUNC-001,VU-FUNC-003","SRC_021（5.4,5.5）,SRC_022（3.1,5）","已确认",""],
 ["VU_REG_002","DYNAMIC_CONFIG","连续寄存器组","0x4804_0004~0x4804_002C（offset 0x0004~0x002C）","32","地址/长度/RF索引/动态参数","见文档","R/W",0,"按字段定义","每次调用变化的操作数","Trigger时快照","VU-FUNC-001","SRC_021（5.4,5.5）","已确认",""],
 ["VU_REG_003","STATIC_CONFIG_xx","8（xx=0~7）","0x4804_1000+0x100*xx（offset 0x1000+0x100*xx）","2048","计算图/Opcode/RF索引","全项","R/W",0,"每组0x100B窗口","常驻宏指令模板","in-flight引用时改写被阻塞","VU-FUNC-001","SRC_021（5.4,5.5,6.3）","已确认",""],
 ["VU_REG_004","macro_inst_left","1","0x4804_3000（offset 0x3000）","32","left","见文档","R",0,"未完成宏指令数","完成轮询","","VU-FUNC-002","SRC_021（5.5）","已确认",""],
 ["VU_REG_005","status","1","0x4804_3004（offset 0x3004）","32","BUSY/状态","见文档","R",0,"状态值","全局状态","","VU-FUNC-002,VU-ERR-001","SRC_021（5.5）","已确认",""],
 ["VU_REG_006","error_code","1","0x4804_3008（offset 0x3008）","32","error bitmap","见文档","R/C",0,"配置/对齐/CM/ECC/数值错误","锁存首个异常并清除","读清异常与快照","VU-ERR-001","SRC_021（5.2,5.5）,SRC_022（4.1）","已确认",""],
 ["VU_REG_007","error_info","1","0x4804_300C（offset 0x300C）","32","config/unit/type/context","见文档","R",0,"首个置位异常上下文","错误定位","","VU-ERR-001","SRC_021（5.5）","已确认",""],
 ["VU_REG_008","snapshot_addr/data","2","0x4804_3010/0x4804_3014（offset 0x3010/0x3014）","32","snapshot","31:0","R/W",0,"动态参数快照","读取异常宏指令实际参数","","VU-ERR-001","SRC_021（5.5）","已确认",""],
 ["VU_REG_009","profile_ctrl/counter","1+32×64-bit","0x4804_4000起（offset 0x4000起）","32/64","RUN及32计数器","见文档","R/W",0,"busy/stall/CM/EU/port计数","性能观测","64-bit需原子读取规则","VU-PERF-002","SRC_021（6.4）","已确认",""]
];
const vuInterfaceRows=[
 ["VU_IF_001","core_cfg","req_valid/ready/write/addr/wdata + rsp_valid/ready/rdata/err","I/O/I/I/I + O/I/O/O","1/1/1/16/32 + 1/1/32/1","MMIO配置","valid-ready","请求和响应分别握手","VU-Core配置；非法访问无副作用","VU-FUNC-001,VU-ERR-001","SRC_022（4.1.2）","已确认",""],
 ["VU_IF_002","noc_cfg","PADDR/PSEL/PENABLE/PWRITE/PWDATA/PREADY/PRDATA/PSLVERR","I/I/I/I/I/O/O/O","32/1/1/1/32/1/32/1","MMIO配置","APB3","Access阶段","Ctrl-NOC访问同一寄存器视图","VU-FUNC-001,VU-ERR-001","SRC_021（3.1）,SRC_022（4.1.2）","已确认",""],
 ["VU_IF_003","dbg_cfg","PADDR/PSEL/PENABLE/PWRITE/PWDATA/PREADY/PRDATA/PSLVERR","I/I/I/I/I/O/O/O","32/1/1/1/32/1/32/1","Debug","APB3","Access阶段","Debug访问同一寄存器视图及RF间接窗口","VU-DBG-001","SRC_021（3.1）,SRC_022（4.1.2）","已确认",""],
 ["VU_IF_004","vu_dsa_cm_rd","req_valid/ready/addr/scale_en + rsp_valid/ready/data/err","O/I/O/O + I/O/I/I","1/1/32/1 + 1/1/1056/1","CoreMem读","固定128B；无burst","请求/返回握手","data与scale按32B+1B×4交织","VU-FUNC-004,VU-ERR-001","SRC_021（3.1）,SRC_022（4.1.2）","已确认",""],
 ["VU_IF_005","vu_dsa_cm_wt","req_valid/ready/addr/data/be + rsp_valid/ready","O/I/O/O/O + I/O","1/1/32/1056/132 + 1/1","CoreMem写","固定132B；无burst","请求/响应握手","非MXFP8 scale字节与BE为0","VU-FUNC-004","SRC_021（3.1）,SRC_022（4.1.2）","已确认",""],
 ["VU_IF_006","vu_dsa_ts_evt","valid/id","O","1/4","完成通知","valid-only","EVENT_EN且宏指令完成","单拍事件；无反压","VU-FUNC-002","SRC_021（3.1）,SRC_022（4.1.2）","已确认",""]
];
const vuExampleRows=[
 ["VU_EX_001","Softmax","VU-FUNC-001,VU-FUNC-002,VU-FUNC-005","静态模板与RF区间已配置","三条宏指令：max；exp+sum+reciprocal；normalize+store","每次调用仅更新动态地址/索引并Trigger","结果写回CM；跨行可双缓冲重叠","是","SRC_021（1.1,5.5,6.3）","已确认",""],
 ["VU_EX_002","RMSNorm/LayerNorm","VU-FUNC-005,VU-NUM-001","静态模板与常量有效","Load、归约、标量倒数/开方、归一化、Store","按动态地址发射宏指令序列","满足对应归一化公式及舍入规则","是","SRC_021（1.1,4,5.4）","已确认",""],
 ["VU_EX_003","SiTU/TopK排序","VU-FUNC-005","输入与K合法","配置排序宏指令","LU读取向量并排序","输出16个最大值与INT16索引","是","SRC_021（1.1,5.4）","已确认",""]
];
const vuFeatureRows=[
 ["VU-FUNC-001","正向功能","静态模板+动态参数宏指令提交","模板0~7且ISQ有空间","macro_inst_trigger,DYNAMIC_CONFIG,STATIC_CONFIG","VU_IF_001~003","静态配置常驻；动态参数每次更新；Trigger一次写入原子发射","宏指令入队/反压","8组模板","SCP_CTRL→VU_CFG,RVCORE→VU","SRC_021（1.1,5.4,5.5）,SRC_022（3.1,4.1）","已确认",""],
 ["VU-FUNC-002","输出结果","完成轮询与TS Event","宏指令完成","macro_inst_left,status","VU_IF_006","可轮询left或由EVENT_EN产生单拍Event；无TS反压","left减少/ts_evt_valid","","","SRC_021（3.1,5.5）,SRC_022（4.1）","已确认",""],
 ["VU-FUNC-003","约束/合法性","Fence与宏指令顺序","FENCE位配置","macro_inst_trigger","","MACRO_INST_FENCE等待全部前序完成；CM_FENCE只等待前序CM访问","派发停顿","","","SRC_021（5.4,6.3）","已确认",""],
 ["VU-FUNC-004","正向功能","CoreMem读写与data/scale布局","地址与格式合法","DYNAMIC_CONFIG","VU_IF_004~005","固定128B读、132B写；32B data+1B scale四组交织；不支持burst","CM请求/响应/数据","128B data；4B scale","VU_DSA→CORE_MEM","SRC_021（3.1）,SRC_022（4.1）","已确认",""],
 ["VU-FUNC-005","正向功能","典型向量算子宏指令图","合法Opcode/数据依赖","STATIC_CONFIG,DYNAMIC_CONFIG","VU_IF_004~005","支持LayerNorm/RMSNorm/Softmax/SwiGLU/MoE Router等组合","CM输出/RF结果","1024-bit/cycle向量宽度","VU_DSA→CORE_MEM","SRC_021（1.1,1.2,4,5.4）","已确认",""],
 ["VU-CONSTR-001","约束/合法性","地址对齐与跨块重组","Load/Store","DYNAMIC_CONFIG","VU_IF_004~005","向量/掩码32B对齐；FP32标量4B、BF16标量2B；硬件拆分跨128B访问","合法请求或error_code","","","SRC_021（3.1,5.2）,SRC_022（4.1）","已确认",""],
 ["VU-NUM-001","约束/合法性","数值、舍入与NaN/Inf","按Opcode/类型","STATIC_CONFIG","VU_IF_004~005","FP32/BF16/MXFP8及舍入规则；可配置NaN/Inf替换并计数","输出值/error/计数器","","","SRC_021（1.2,4,6.4）","已确认",""],
 ["VU-ERR-001","错误处理","配置、地址、CM与数值错误","任一错误","error_code,error_info,snapshot","VU_IF_001~005","非法MMIO无副作用；锁存首错上下文与动态参数快照；读error_code清除","rsp_err/PSLVERR/error_code","","","SRC_021（5.2,5.3,5.5）,SRC_022（4.1）","已确认",""],
 ["VU-DBG-001","Debug","统一配置视图与RF间接访问","Debug访问","status/snapshot/RF窗口","VU_IF_003","Debug与Core/NOC仲裁，共用寄存器视图","响应/错误/快照","","","SRC_021（3.1,5）,SRC_022（4.1）","已确认",""],
 ["VU-PERF-001","性能","宏指令重叠与阻塞","无依赖/冲突/Fence","","VU_IF_004~006","最多相邻两条重叠；目标重叠收益≥90%，发射阻塞≤5%，主要VALU利用率≥70%","周期与stall计数","见指标条件","","SRC_021（6.2,6.3）","已确认",""],
 ["VU-PERF-002","性能","32项性能计数器","profile RUN=1","profile_ctrl/counter","VU_IF_004~005","统计busy、issue stall、CM、EU与端口；64-bit原子读取","计数器可读","32 counters","","SRC_021（6.4）","已确认",""]
];
for(const r of paths){
 if(r[1]?.startsWith("dte_dsa2core_mem")){r[12]="DTE-FUNC-003,DTE-FUNC-004,DTE-FUNC-005,DTE-CONSTR-001";r[13]="SRC_009,SRC_017,SRC_018";r[14]="已确认";r[15]="";}
 if(r[1]?.startsWith("dte_dsa2matrix_mem")){r[12]="DTE-FUNC-003,DTE-FUNC-004,DTE-FUNC-005,DTE-FUNC-011,DTE-CONSTR-001";r[13]="SRC_009,SRC_017,SRC_018";r[14]="已确认";r[15]="";}
 if(r[1]?.startsWith("dte_dsa2share_mem")){r[12]="DTE-FUNC-006";r[13]="SRC_009,SRC_017,SRC_018";r[14]="已确认";r[15]="";}
 if(r[1]==="dte_dsa2mu_dsa_legal_001"){r[2]="DTE_DSA→MU_TOPK";r[3]="dte2mm（sel=1）";r[4]="0x0";r[5]="0xF";r[6]="sel=1；stream entry index=0~15；TopK已由外部准备完成";r[7]="索引越界或接口错误";r[8]="RW";r[9]="256 Byte/entry（2×128B同拍）";r[10]="请求/响应配对；错误由共享dte2mm接口返回";r[12]="DTE-FUNC-011,MU-FUNC-003";r[13]="SRC_009,SRC_017（3,4）,SRC_018（2.2,5）,SRC_019（5.2.7）,SRC_020（3,7）";r[14]="已确认";r[15]="";}
 if(r[1]==="vu_dsa2core_mem_legal_001"){r[12]="VU-FUNC-004,VU-FUNC-005,VU-CONSTR-001,VU-ERR-001";r[13]="SRC_009,SRC_021,SRC_022";}
 if(r[1]==="mu_dsa2core_mem_legal_001"){r[12]="MU-FUNC-002,MU-FUNC-004,MU-CONSTR-001,MU-ERR-001";r[13]="SRC_009,SRC_019,SRC_020";}
}

const questions=[
 ["Q_001","Path","实现绑定缺失","P2","跨模块通路","","既有SCP/RV通路","Module例化链未完整提取","地址与通路已知","补充Master、中间链和Slave完整层次路径","影响DUT绑定，不阻塞抽象TP","待确认"],
 ["Q_002","Path","信息缺失","P1","模块内","VU","vu_dsa2core_mem_legal_001","Master视角空间与访问方式不明确","Dummy接口完整且纳入","确认地址、对齐、访问方式和返回位宽","影响VU Path TP","待确认"],
 ["Q_003","Path","信息缺失","P1","模块内","MU","mu_dsa2core_mem_legal_001","Master视角空间与访问方式不明确","Dummy接口完整且纳入","确认地址、对齐、访问方式和返回位宽","影响MU Path TP","待确认"],
 ["Q_004","Path","可观察性缺失","P1","跨模块通路","VU/MU","vu2cm、mu2cm","系统级Checker采用的错误码映射仍未统一","VU文档给出rsp_err/error_code；MU文档给出ECC/busERR及CM写无Bresp","确认CoreMem侧各错误编码到VU/MU状态寄存器及ST期望结果的统一映射","影响Checker","待确认"],
 ["Q_005","Module","信息缺失","P1","模块内","DTE","SYS_CTRL/SYS_STATUS","最终offset、bit位置与Reset未全部定稿","已知Ctrl Status域、SYS_STATUS Reset及控制功能集合","确认最终寄存器地址、字段位宽/位置、Access、Reset和控制语义","影响DTE Debug/恢复类TP与DUT绑定","待确认"],
 ["Q_006","Module","可观察性缺失","P1","模块内","DTE","异常通知与恢复","异常对外通知接口、错误码和恢复完成判据不明确","错误分类、Drain/Fence和异常任务不回正常ACK已明确","确认异常如何对外通知（中断/状态轮询/其它）、各错误码与恢复完成判据","影响DTE错误注入Checker","待确认"],
 ["Q_007","Module","信息缺失","P2","模块内","DTE","PMU/Outstanding/TaskQ观测","精确性能参数和可观测字段布局不完整","已知TaskQ=16、Buffer=8KB并支持Outstanding","确认各接口精确Outstanding深度、PMU事件/offset及TaskQ项的可读字段布局","影响性能与调试TP，不阻塞基础功能TP","待确认"],
];

// 输入件描述与分析
{
 const s=wb.worksheets.add("输入件描述与分析");s.showGridLines=false;s.tabColor=C.navy;title(s,"A2:K2","ST Verify TP 唯一证据输入件描述与分析");
 let row=4;section(s,`A${row}:F${row}`,"输入来源");row=addTable(s,row+1,["来源ID","输入分类","输入位置","作用范围","关联模块","提取内容"],sources)+2;
 section(s,`A${row}:K${row}`,"DUT对象与接口");const objectDataStart=row+2;row=addTable(s,row+1,["对象ID","对象类型","对象名称","Module例化","接口/协议","数据宽度(bit)","地址宽度(bit)","支持操作","依据","确认状态","校准问题ID"],objects)+2;mergeConsecutive(s,objects,objectDataStart,0,[0]);mergeConsecutive(s,objects,objectDataStart,1,[0,1]);mergeConsecutive(s,objects,objectDataStart,2,[0,2]);mergeConsecutive(s,objects,objectDataStart,3,[0,3]);
 section(s,`A${row}:G${row}`,"自定义协议");const customDataStart=row+2;row=addTable(s,row+1,["协议名称","通道","信号","方向","位宽(bit)","含义","依据"],customRows)+2;mergeConsecutive(s,customRows,customDataStart,0,[0]);mergeConsecutive(s,customRows,customDataStart,1,[0,1]);
 section(s,`A${row}:G${row}`,"DUT映射");row=addTable(s,row+1,["通路ID","Master模块例化","中间模块例化链","Slave模块例化","依据","确认状态","校准问题ID"],mappings)+2;
 section(s,`A${row}:H${row}`,"验证规则");addTable(s,row+1,["规则项ID","配置问题","可选项","工程选择","适用范围","依据","确认状态","校准问题ID"],rules);
 s.freezePanes.freezeRows(4);widths(s,{A:22,B:24,C:38,D:28,E:18,F:36,G:20,H:18,I:18,J:14,K:20});
}
{
 const s=wb.worksheets.add("Path特性");s.showGridLines=false;s.tabColor="#70AD47";title(s,"A2:J2","Path特性（协议固定必填清单）");addTable(s,4,["特性ID","协议分类","特性项","特性值/行为","适用条件","非法/例外行为","关联通路","依据","确认状态","校准问题ID"],featureRows);s.freezePanes.freezeRows(4);widths(s,{A:29,B:12,C:20,D:18,E:26,F:25,G:48,H:19,I:13,J:18});
}
{
 const s=wb.worksheets.add("通路与地址空间");s.showGridLines=false;s.tabColor="#4472C4";title(s,"A2:P2","通路与地址空间");addTable(s,4,["Master","通路ID","通路描述","通路协议","起始地址","结束地址","合法条件","非法原因","测试操作","支持的访问粒度/特性ID","期望响应","关联Path特性ID","关联Feature ID","依据","确认状态","校准问题ID"],paths);
 mergeConsecutive(s,paths,5,0,[0]);mergeConsecutive(s,paths,5,2,[0,2]);mergeConsecutive(s,paths,5,3,[0,3]);
 for(let i=0;i<paths.length;i++)if(String(paths[i][1]).includes("_illegal_"))s.getRange(`B${5+i}:P${5+i}`).format.fill=C.red;
 s.freezePanes.freezeRows(4);s.freezePanes.freezeColumns(3);widths(s,{A:15,B:38,C:25,D:18,E:15,F:15,G:31,H:28,I:12,J:28,K:30,L:42,M:23,N:18,O:13,P:20});
}
{
 const s=wb.worksheets.add("TS");s.showGridLines=false;s.tabColor="#8064A2";title(s,"A2:P2","Module Profile：TS");
 let row=4;section(s,`A${row}:P${row}`,"MMIO信息");const mmioStart=row+2;row=addTable(s,row+1,["MMIO ID","Register对象","Count/索引范围","Offset/Address","Width","Field","Bit范围","Access/写Mask","Reset","值空间","字段语义","Side Effect","关联Feature ID","依据","确认状态","校准问题ID"],tsMmioRows)+2;s.getRange(`A${mmioStart}:P${mmioStart+tsMmioRows.length-1}`).format.rowHeight=42;
 section(s,`A${row}:M${row}`,"接口信息");const ifStart=row+2;row=addTable(s,row+1,["接口ID","接口名称","Signal/Field","方向","位宽","接口角色","值空间","有效条件","语义/行为","关联Feature ID","依据","确认状态","校准问题ID"],tsInterfaceRows)+2;s.getRange(`A${ifStart}:M${ifStart+tsInterfaceRows.length-1}`).format.rowHeight=40;
 section(s,`A${row}:K${row}`,"编程示例");const exStart=row+2;row=addTable(s,row+1,["示例ID","示例名称","关联Feature ID","前置条件","MMIO配置","接口输入/操作","预期结果","是否为完整规则","依据","确认状态","校准问题ID"],tsExampleRows)+2;s.getRange(`A${exStart}:K${exStart+tsExampleRows.length-1}`).format.rowHeight=60;
 section(s,`A${row}:M${row}`,"Feature");const ftStart=row+2;addTable(s,row+1,["Feature ID","Feature分类","Feature名称","适用条件","涉及MMIO对象","涉及接口对象","行为/约束表达","ST可观察结果","性能指标/阈值","关联通路ID","依据","确认状态","校准问题ID"],tsFeatureRows);s.getRange(`A${ftStart}:M${ftStart+tsFeatureRows.length-1}`).format.rowHeight=48;
 s.freezePanes.freezeRows(4);widths(s,{A:18,B:22,C:20,D:34,E:12,F:20,G:14,H:12,I:12,J:23,K:25,L:24,M:20,N:24,O:14,P:18});
}
{
 const s=wb.worksheets.add("DTE");s.showGridLines=false;s.tabColor="#5B9BD5";title(s,"A2:P2","Module Profile：DTE");
 let row=4;section(s,`A${row}:P${row}`,"MMIO信息");const mmioStart=row+2;row=addTable(s,row+1,["MMIO ID","Register对象","Count/索引范围","Offset/Address","Width","Field","Bit范围","Access/写Mask","Reset","值空间","字段语义","Side Effect","关联Feature ID","依据","确认状态","校准问题ID"],dteMmioRows)+2;s.getRange(`A${mmioStart}:P${mmioStart+dteMmioRows.length-1}`).format.rowHeight=45;
 section(s,`A${row}:M${row}`,"接口信息");const ifStart=row+2;row=addTable(s,row+1,["接口ID","接口名称","Signal/Field","方向","位宽","接口角色","值空间","有效条件","语义/行为","关联Feature ID","依据","确认状态","校准问题ID"],dteInterfaceRows)+2;s.getRange(`A${ifStart}:M${ifStart+dteInterfaceRows.length-1}`).format.rowHeight=48;
 section(s,`A${row}:K${row}`,"编程示例");const exStart=row+2;row=addTable(s,row+1,["示例ID","示例名称","关联Feature ID","前置条件","MMIO配置","接口输入/操作","预期结果","是否为完整规则","依据","确认状态","校准问题ID"],dteExampleRows)+2;s.getRange(`A${exStart}:K${exStart+dteExampleRows.length-1}`).format.rowHeight=60;
 section(s,`A${row}:M${row}`,"Feature");const ftStart=row+2;addTable(s,row+1,["Feature ID","Feature分类","Feature名称","适用条件","涉及MMIO对象","涉及接口对象","行为/约束表达","ST可观察结果","性能指标/阈值","关联通路ID","依据","确认状态","校准问题ID"],dteFeatureRows);s.getRange(`A${ftStart}:M${ftStart+dteFeatureRows.length-1}`).format.rowHeight=52;
 s.freezePanes.freezeRows(4);widths(s,{A:18,B:24,C:24,D:38,E:13,F:22,G:16,H:14,I:14,J:26,K:28,L:26,M:23,N:26,O:14,P:18});
}
{
 const s=wb.worksheets.add("MU");s.showGridLines=false;s.tabColor="#ED7D31";title(s,"A2:P2","Module Profile：MU");
 let row=4;section(s,`A${row}:P${row}`,"MMIO信息");const mmioStart=row+2;row=addTable(s,row+1,["MMIO ID","Register对象","Count/索引范围","Offset/Address","Width","Field","Bit范围","Access/写Mask","Reset","值空间","字段语义","Side Effect","关联Feature ID","依据","确认状态","校准问题ID"],muMmioRows)+2;s.getRange(`A${mmioStart}:P${mmioStart+muMmioRows.length-1}`).format.rowHeight=48;
 section(s,`A${row}:M${row}`,"接口信息");const ifStart=row+2;row=addTable(s,row+1,["接口ID","接口名称","Signal/Field","方向","位宽","接口角色","值空间","有效条件","语义/行为","关联Feature ID","依据","确认状态","校准问题ID"],muInterfaceRows)+2;s.getRange(`A${ifStart}:M${ifStart+muInterfaceRows.length-1}`).format.rowHeight=50;
 section(s,`A${row}:K${row}`,"编程示例");const exStart=row+2;row=addTable(s,row+1,["示例ID","示例名称","关联Feature ID","前置条件","MMIO配置","接口输入/操作","预期结果","是否为完整规则","依据","确认状态","校准问题ID"],muExampleRows)+2;s.getRange(`A${exStart}:K${exStart+muExampleRows.length-1}`).format.rowHeight=62;
 section(s,`A${row}:M${row}`,"Feature");const ftStart=row+2;addTable(s,row+1,["Feature ID","Feature分类","Feature名称","适用条件","涉及MMIO对象","涉及接口对象","行为/约束表达","ST可观察结果","性能指标/阈值","关联通路ID","依据","确认状态","校准问题ID"],muFeatureRows);s.getRange(`A${ftStart}:M${ftStart+muFeatureRows.length-1}`).format.rowHeight=54;
 s.freezePanes.freezeRows(4);widths(s,{A:18,B:25,C:24,D:40,E:13,F:24,G:17,H:14,I:14,J:28,K:30,L:27,M:24,N:26,O:14,P:18});
}
{
 const s=wb.worksheets.add("VU");s.showGridLines=false;s.tabColor="#A5A5A5";title(s,"A2:P2","Module Profile：VU");
 let row=4;section(s,`A${row}:P${row}`,"MMIO信息");const mmioStart=row+2;row=addTable(s,row+1,["MMIO ID","Register对象","Count/索引范围","Offset/Address","Width","Field","Bit范围","Access/写Mask","Reset","值空间","字段语义","Side Effect","关联Feature ID","依据","确认状态","校准问题ID"],vuMmioRows)+2;s.getRange(`A${mmioStart}:P${mmioStart+vuMmioRows.length-1}`).format.rowHeight=48;
 section(s,`A${row}:M${row}`,"接口信息");const ifStart=row+2;row=addTable(s,row+1,["接口ID","接口名称","Signal/Field","方向","位宽","接口角色","值空间","有效条件","语义/行为","关联Feature ID","依据","确认状态","校准问题ID"],vuInterfaceRows)+2;s.getRange(`A${ifStart}:M${ifStart+vuInterfaceRows.length-1}`).format.rowHeight=52;
 section(s,`A${row}:K${row}`,"编程示例");const exStart=row+2;row=addTable(s,row+1,["示例ID","示例名称","关联Feature ID","前置条件","MMIO配置","接口输入/操作","预期结果","是否为完整规则","依据","确认状态","校准问题ID"],vuExampleRows)+2;s.getRange(`A${exStart}:K${exStart+vuExampleRows.length-1}`).format.rowHeight=65;
 section(s,`A${row}:M${row}`,"Feature");const ftStart=row+2;addTable(s,row+1,["Feature ID","Feature分类","Feature名称","适用条件","涉及MMIO对象","涉及接口对象","行为/约束表达","ST可观察结果","性能指标/阈值","关联通路ID","依据","确认状态","校准问题ID"],vuFeatureRows);s.getRange(`A${ftStart}:M${ftStart+vuFeatureRows.length-1}`).format.rowHeight=56;
 s.freezePanes.freezeRows(4);widths(s,{A:18,B:25,C:24,D:40,E:13,F:24,G:17,H:14,I:14,J:28,K:30,L:27,M:24,N:26,O:14,P:18});
}
{
 const s=wb.worksheets.add("校准问题");s.showGridLines=false;s.tabColor="#C65911";title(s,"A2:L2","校准问题（仅保留未决项）");addTable(s,4,["问题ID","Profile","问题分类","优先级","影响层级","影响模块","影响对象","问题内容","当前已知信息","需要确认内容","影响范围","状态"],questions);s.freezePanes.freezeRows(4);widths(s,{A:12,B:12,C:18,D:10,E:18,F:15,G:28,H:32,I:35,J:46,K:28,L:13});
}
for(const s of wb.worksheets.items){const u=s.getUsedRange();u.format.verticalAlignment="center";u.format.font.name=font;}
wb.recalculate();
await fs.mkdir(path.dirname(outputPath),{recursive:true});await fs.mkdir(previewDir,{recursive:true});
for(const s of wb.worksheets.items){const img=await wb.render({sheetName:s.name,autoCrop:"all",scale:1,format:"png"});await fs.writeFile(path.join(previewDir,`${s.name}.png`),new Uint8Array(await img.arrayBuffer()));}
const out=await SpreadsheetFile.exportXlsx(wb);await out.save(outputPath);
console.log(JSON.stringify({outputPath,sheets:wb.worksheets.items.map(s=>s.name),pathCount:paths.length,featureCount:featureRows.length}));
