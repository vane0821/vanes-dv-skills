import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const file="path-verification-testpoint-generator/templates/bach-core-path-tp-input-v1.xlsx";
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(file));
const required=["基础信息","通路与地址空间","验证规则","DUT映射","校准问题"];
const names=wb.worksheets.items.map(s=>s.name);
for (const name of required) if (!names.includes(name)) throw new Error(`缺少Sheet: ${name}`);

const base=wb.worksheets.getItem("基础信息").getRange("A1:J100").values;
for (const row of base) {
  if (row[1]==="Slave" && !(row[3]==="APB" && row[4]===32)) throw new Error(`Slave协议/宽度错误: ${row[0]}`);
  if (row[8]==="待确认" && !row[9]) throw new Error(`待确认但无校准问题ID: ${row[0]}`);
}
const dteObject=base.find(row=>row[0]==="DTE_DSA");
if (!dteObject || dteObject[4]!=="32/2048" || dteObject[5]!==32) throw new Error("DTE_DSA对象宽度未按MAS第5章校准");

const paths=wb.worksheets.getItem("通路与地址空间").getRange("B5:M39").values;
if (paths.length!==35) throw new Error(`通路数量错误: ${paths.length}`);
if (paths.some(row=>/dte_dsa2matrix_mem_(data|scale)_/.test(row[0]))) throw new Error("DSA视角不得把Matrix data/scale拆成两个Region");
const questions=wb.worksheets.getItem("校准问题").getRange("A5:F11").values;
const questionIds=questions.map(row=>row[0]);
if (questionIds.join(",")!=="Q_001,Q_002,Q_003,Q_004,Q_005,Q_006,Q_007") throw new Error(`当前未决问题编号错误: ${questionIds.join(",")}`);
for (const row of questions) if (row[5]!=="待确认") throw new Error(`校准问题表包含非未决项: ${row[0]}=${row[5]}`);
for (const row of questions) if (/双lane|lane|乱序|未决请求|返回匹配|返回顺序/.test(row.join(" "))) throw new Error(`校准问题包含ST不可见的内部实现语义: ${row[0]}`);
const validQuestionIds=new Set(questionIds);
const checkRefs=(refs,where)=>{ for (const id of String(refs||"").split(",").filter(Boolean)) if (!validQuestionIds.has(id)) throw new Error(`${where}引用不存在的问题: ${id}`); };
for (const row of base) if (row[0] && row[8]==="待确认") checkRefs(row[9],row[0]);
const seen=new Set();
const idRe=/^[a-z0-9_]+2[a-z0-9_]+_(legal|illegal|conditional)_\d{3}$/;
for (const row of paths) {
  const id=row[0];
  if (!idRe.test(id)) throw new Error(`通路ID格式错误: ${id}`);
  if (seen.has(id)) throw new Error(`通路ID重复: ${id}`);
  seen.add(id);
  if (id.includes("_illegal_") && (!row[5] || !row[8])) throw new Error(`非法通路缺原因或响应: ${id}`);
  if (row[10]==="待确认" && !row[11]) throw new Error(`待确认通路无校准问题ID: ${id}`);
  checkRefs(row[11],id);
  if (id.startsWith("scp_ctrl2") && id.includes("_legal_") && row[8]!=="READ:RRESP=OKAY；WRITE:BRESP=OKAY") throw new Error(`SCP合法通路未检查RRESP/BRESP: ${id}`);
}

const protocolNames=new Set(base.map(row=>row[0]).filter(value=>["rvcore2dsa","dte2cm","dte2mm","dte2sm","dte2mu","vu2cm","mu2cm"].includes(value)));
for (const requiredProtocol of ["rvcore2dsa","dte2cm","dte2mm","dte2sm","dte2mu","vu2cm","mu2cm"]) if (!protocolNames.has(requiredProtocol)) throw new Error(`缺少自定义协议: ${requiredProtocol}`);
for (const row of paths.filter(row=>/^(dte|vu|mu)_dsa2/.test(row[0]))) if (!protocolNames.has(row[1])) throw new Error(`内部通路协议未定义: ${row[0]}=${row[1]}`);
for (const id of ["dte_dsa2core_mem_legal_001","dte_dsa2matrix_mem_legal_001","dte_dsa2share_mem_legal_001"]) {
  const row=paths.find(item=>item[0]===id); if (!row || !row[2] || !row[3] || !row[4]) throw new Error(`DTE MAS通路未完成地址/条件校准: ${id}`);
}

const rules=wb.worksheets.getItem("验证规则").getRange("A5:H12").values;
for (const row of rules) checkRefs(row[7],row[0]);
const selectedRule=Object.fromEntries(rules.map(row=>[row[0],row[3]]));
if (selectedRule.VR_002!=="穷举" || selectedRule.VR_006!=="全交叉" || selectedRule.VR_008!=="RW") throw new Error("扫描/交叉规则未按用户确认固化");
const mappings=wb.worksheets.getItem("DUT映射").getRange("A5:G39").values;
for (const row of mappings) checkRefs(row[6],row[0]);

const errors=await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",options:{useRegex:true,maxResults:100},summary:"formula errors",maxChars:1500});
console.log(JSON.stringify({sheets:names,pathCount:paths.length,allApbSlaves32Bit:true,checks:"PASS"}));
console.log(errors.ndjson);
