import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputPath = path.resolve("path-verification-testpoint-generator/templates/bach-core-path-tp-input-v1.xlsx");
const previewDir = path.resolve("path-verification-testpoint-generator/.preview");
const workbook = Workbook.create();
const font = "Arial";
const navy = "#1F4E78";
const blue = "#D9EAF7";
const amber = "#FFF2CC";
const red = "#FCE8E6";
const green = "#E2F0D9";
const gray = "#F2F2F2";

function title(sheet, range, value) {
  sheet.getRange(range).merge();
  const cell = sheet.getRange(range);
  cell.values = [[value]];
  cell.format.font = { name: font, size: 14, bold: true, color: "#1F1F1F" };
  cell.format.rowHeight = 25;
}

function section(sheet, range, value) {
  sheet.getRange(range).merge();
  const cell = sheet.getRange(range);
  cell.values = [[value]];
  cell.format = { fill: blue, font: { name: font, size: 11, bold: true, color: "#1F1F1F" } };
}

function header(range) {
  range.format = {
    fill: navy,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#D9E2F3" },
  };
  range.format.rowHeight = 32;
}

function body(range) {
  range.format.font = { name: font, size: 10, color: "#1F1F1F" };
  range.format.verticalAlignment = "center";
  range.format.wrapText = true;
  range.format.borders = { preset: "inside", style: "thin", color: "#E7E6E6" };
}

function widths(sheet, values) {
  for (const [col, width] of Object.entries(values)) sheet.getRange(`${col}:${col}`).format.columnWidth = width;
}

const sourceRows = [
  ["SRC_001", "飞书多维表", "NoC Base：OVnGwUdyBimdauk2D3JcjFq5nPe", "Master、Slave、连接关系"],
  ["SRC_002", "飞书文档", "Bach_core_MAS_TOP：IB00wb9Oyi1gtgkmEBBcqUfinQb，第3.2章", "地址空间与内存容量说明"],
  ["SRC_003", "代码", "/fastone/users/miaomiaowen/project/bach_core/dv_bachcore/st/common/memory_address.svh", "Master视角地址、Region基地址和容量"],
  ["SRC_004", "代码", "/fastone/users/miaomiaowen/project/bach_core/dv_bachcore/st/core_ref/uvm_tb", "Module例化、接口与响应行为"],
  ["SRC_005", "用户确认", "2026-10-13讨论记录", "当前全部地址空间穷举扫描（含DSA视角合并后的36 MiB）;\n地址×R/W全交叉;\n检查RRESP/BRESP;\n非法响应为Error;\n暂不做assertion"],
  ["SRC_006", "用户确认", "2026-10-13讨论记录", "所有Slave端均为APB协议，数据宽度均为32 bit"],
  ["SRC_007", "用户截图", "rvcore2dsa Interface信号表", "RV Core自定义读写协议、地址/数据/标识字段和读返回"],
  ["SRC_008", "用户确认", "2026-10-13讨论记录", "访问粒度4 Byte；非法空间由Slave返回resp=ERROR；统一vu_core_s；APB地址宽度32 bit；RV Core使用自定义协议"],
  ["SRC_009", "代码", "/fastone/users/miaomiaowen/project/bach_core/ai_core_50p_temp/rtl/ai_core/rtl/bach_core/bach_core_top.v", "仅从Top提取DSA内部结构通路、实例连接与接口信号"],
  ["SRC_010", "飞书文档", "DTE DSA：HH8iwPKfmizjURkVTgGcTA9Tn7d，第5章", "DTE全局地址语义、transfer_mode、seg_valid、长度/对齐和异常行为"],
  ["SRC_011", "用户确认", "2026-10-13讨论记录", "32 MiB也穷举；DSA视角data/scale合并后36 MiB仍穷举；地址×R/W全交叉；检查RRESP/BRESP；Dummy通路纳入TP且接口完整、内部为空"],
];

const objects = [
  ["SCP_CTRL", "Master", "scp_bach_ctrl_m0", "AXI4", 256, 32, "READ\nWRITE", "SRC_001", "已确认", ""],
  ["RV_CORE", "Master", "RV Core", "待确认", "待确认", 32, "READ\nWRITE", "SRC_002,SRC_003", "待确认", "Q_011"],
  ["CORE_STATUS", "Slave", "core_status_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["TS_CFG", "Slave", "ts_cfg_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["DTE_CORE", "Slave", "dte_core_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["MU_CORE", "Slave", "mu_core_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["VU_CORE", "Slave", "vu_core_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_007,Q_009"],
  ["DTE_CFG", "Slave", "dte_dsa_cfg_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["MU_CFG", "Slave", "mu_dsa_cfg_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["VU_CFG", "Slave", "vu_dsa_cfg_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_006", "待确认", "Q_009"],
  ["DTE_ITCM", "Slave", "dte_itcm_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["MU_ITCM", "Slave", "mu_itcm_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["VU_ITCM", "Slave", "vu_itcm_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["DTE_DTCM", "Slave", "dte_dtcm_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["MU_DTCM", "Slave", "mu_dtcm_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["VU_DTCM", "Slave", "vu_dtcm_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["SHARE_MEM", "Slave", "share_mem_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["CORE_MEM", "Slave", "core_mem_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["MATRIX_MEM", "Slave", "matrix_mem_s", "APB", 32, "待确认", "READ\nWRITE", "SRC_001,SRC_003,SRC_006", "待确认", "Q_009"],
  ["DTE_DSA", "Master", "u_dte_dsa", "Custom(dte2cm/dte2mm/dte2sm/dte2mu)", "32/2048", 32, "READ\nWRITE", "SRC_009,SRC_010", "待确认", "Q_005,Q_006"],
  ["VU_DSA", "Master", "u_vu_dsa", "Custom(vu2cm)", 1056, 32, "READ\nWRITE", "SRC_009", "待确认", "Q_007"],
  ["MU_DSA", "Master", "u_mu_mmem", "Custom(mu2cm)", "2048/2112", 26, "READ\nWRITE", "SRC_009", "待确认", "Q_007"],
];

const pathRows = [
  ["scp_ctrl2core_status_legal_001","0x4800_0000","0x4800_7FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2ts_cfg_legal_001","0x4800_8000","0x4800_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2dte_core_legal_001","0x4801_0000","0x4801_7FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2mu_core_legal_001","0x4801_8000","0x4801_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2vu_core_legal_001","0x4802_0000","0x4802_7FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_007,Q_008"],
  ["scp_ctrl2dte_cfg_legal_001","0x4802_8000","0x4802_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2mu_cfg_legal_001","0x4803_0000","0x4803_7FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2none_illegal_001","0x4803_8000","0x4803_FFFF","","地址未映射到任何Slave","READ\nWRITE","待确认","Error","SRC_003","待确认","Q_001,Q_002"],
  ["scp_ctrl2vu_cfg_legal_001","0x4804_0000","0x4804_7FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2dte_itcm_legal_001","0x8000_0000","0x8000_0FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2dte_itcm_illegal_001","0x8000_1000","0x8000_7FFF","","超出DTE ITCM实际容量","READ\nWRITE","待确认","Error","SRC_001,SRC_003","待确认","Q_001,Q_002,Q_003"],
  ["scp_ctrl2mu_itcm_legal_001","0x8000_8000","0x8000_8FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2mu_itcm_illegal_001","0x8000_9000","0x8000_FFFF","","超出MU ITCM实际容量","READ\nWRITE","待确认","Error","SRC_001,SRC_003","待确认","Q_001,Q_002,Q_003"],
  ["scp_ctrl2vu_itcm_legal_001","0x8001_0000","0x8001_0FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2vu_itcm_illegal_001","0x8001_1000","0x8001_7FFF","","超出VU ITCM实际容量","READ\nWRITE","待确认","Error","SRC_001,SRC_003","待确认","Q_001,Q_002,Q_003"],
  ["scp_ctrl2dte_dtcm_legal_001","0x8010_0000","0x8010_1FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2dte_dtcm_illegal_001","0x8010_2000","0x8010_7FFF","","超出DTE DTCM实际容量","READ\nWRITE","待确认","Error","SRC_001,SRC_003","待确认","Q_001,Q_002,Q_003"],
  ["scp_ctrl2mu_dtcm_legal_001","0x8010_8000","0x8010_9FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2mu_dtcm_illegal_001","0x8010_A000","0x8010_FFFF","","超出MU DTCM实际容量","READ\nWRITE","待确认","Error","SRC_001,SRC_003","待确认","Q_001,Q_002,Q_003"],
  ["scp_ctrl2vu_dtcm_legal_001","0x8011_0000","0x8011_1FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2vu_dtcm_illegal_001","0x8011_2000","0x8011_7FFF","","超出VU DTCM实际容量","READ\nWRITE","待确认","Error","SRC_001,SRC_003","待确认","Q_001,Q_002,Q_003"],
  ["scp_ctrl2share_mem_legal_001","0x8020_0000","0x8021_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2core_mem_data_legal_001","0x8040_0000","0x804F_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2core_mem_scale_legal_001","0x8050_0000","0x8050_7FFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_008"],
  ["scp_ctrl2matrix_mem_data_legal_001","0x8400_0000","0x85FF_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_005,Q_008"],
  ["scp_ctrl2matrix_mem_scale_legal_001","0x8600_0000","0x863F_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_003","待确认","Q_001,Q_005,Q_008"],
  ["rv_core2itcm_legal_001","0x0000_0000","0x0000_0FFF","","","READ\nWRITE","待确认","正常响应","SRC_002,SRC_003","待确认","Q_001,Q_008,Q_011"],
  ["rv_core2dtcm_legal_001","0x0010_0000","0x0010_1FFF","","","READ\nWRITE","待确认","正常响应","SRC_002,SRC_003","待确认","Q_001,Q_008,Q_011"],
  ["rv_core2share_mem_legal_001","0x0020_0000","0x0021_FFFF","","","READ\nWRITE","待确认","正常响应","SRC_002,SRC_003","待确认","Q_001,Q_008,Q_011"],
  ["dte_dsa2core_mem_legal_001","0x8040_0000","0x804F_FFFF","transfer_mode=000/010/100且对应段有效；DTE使用全局地址，CM取低20bit","","READ\nWRITE","待确认","Task完成且无BUS_ERR/MEM ECC ERR","SRC_003,SRC_009,SRC_010","待确认","NEW_Q005,NEW_Q006"],
  ["dte_dsa2matrix_mem_legal_001","0x8400_0000","0x863F_FFFF","transfer_mode=001/011/100且对应段有效；DTE使用全局地址，MM取低26bit；data/scale为同一Region内不同访问方式，返回有效数据宽度不同","","READ\nWRITE","待确认","Task完成且无BUS_ERR/MEM ECC ERR","SRC_003,SRC_009,SRC_010","待确认","NEW_Q005,NEW_Q006"],
  ["dte_dsa2share_mem_legal_001","0x8020_0000","0x8021_FFFF","wr_sharemem_flag=1且对应TaskQ Entry到达Done；写完成后才允许通知TS","","WRITE","待确认","完成一笔32-bit flag写入且无BUS_ERR/MEM ECC ERR","SRC_003,SRC_009,SRC_010","待确认","NEW_Q006"],
  ["dte_dsa2mu_dsa_legal_001","","","地址范围、地址单位和有效条件待确认","","READ\nWRITE","待确认","待确认","SRC_009","待确认","NEW_Q002,NEW_Q006"],
  ["vu_dsa2core_mem_legal_001","","","地址范围、地址单位和有效条件待确认；Dummy接口完整、内部为空，仍纳入TP范围","","READ\nWRITE","待确认","待确认","SRC_009,SRC_011","待确认","NEW_Q003,NEW_Q007"],
  ["mu_dsa2core_mem_legal_001","","","地址范围、地址单位和有效条件待确认；Dummy接口完整、内部为空，仍纳入TP范围","","READ\nWRITE","待确认","待确认","SRC_009,SRC_011","待确认","NEW_Q004,NEW_Q007"],
];

const ruleRows = [
  ["VR_001","小地址空间采用哪种扫描策略？","穷举\n边界抽样\n典型地址抽样\n不扫描","穷举","≤1 MiB地址空间","SRC_005","已确认",""],
  ["VR_002","大地址空间采用哪种扫描策略？","穷举\n边界抽样\n固定步长抽样\n典型地址抽样\n随机抽样","穷举",">1 MiB且≤36 MiB地址空间","SRC_011","已确认",""],
  ["VR_003","是否检查合法区间边界？","是\n否","是","全部合法区间","SRC_005","已确认",""],
  ["VR_004","如何检查合法区间外越界访问？","上越界和下越界\n仅上越界\n仅下越界\n不检查","上越界和下越界","全部合法区间","SRC_005","已确认",""],
  ["VR_005","如何扫描显式非法空间？","每区间至少一个地址\n边界地址\n全区间穷举\n不扫描","每区间至少一个地址","全部非法区间","SRC_005","已确认",""],
  ["VR_006","合法地址与R/W如何交叉？","全交叉\nR和W各一个代表地址\n不交叉","全交叉","全部合法区间","SRC_011","已确认",""],
  ["VR_007","地址边界与访问粒度如何交叉？","全交叉\n仅最大粒度\n每种粒度各一个边界\n不交叉","不交叉","边界地址","SRC_008","已确认",""],
  ["VR_008","非法地址需要执行哪些操作？","R\nW\nRW","RW","全部非法区间","SRC_011","已确认",""],
  ["VR_009","使用哪些验证方法？","testcase\ntestcase+covergroup\nassertion\ntestcase+covergroup+assertion","testcase+covergroup","全部Path TP","SRC_005","已确认",""],
];

const calibrationRows = [
  ["Q_001","既有29条SCP_CTRL/RV_CORE通路","Module例化链尚未从core_ref/uvm_tb提取","新增DSA通路的Top实例链已确认；既有通路仍显示待提取","为每条既有通路补充Master实例、中间模块实例链和Slave实例完整层次路径","待确认"],
  ["Q_002","dte_dsa2mu_dsa_legal_001","4-bit地址的语义与合法范围不明确","Top仅给出dte_mu_rd/wr_addr[3:0]及RW握手；DTE MAS第5章未定义该通路","确认地址是寄存器索引还是字节地址、合法值范围、选择/使能条件及越界行为","待确认"],
  ["Q_003","vu_dsa2core_mem_legal_001","VU_DSA看到的32-bit CM地址空间与访问方式不明确","Top给出vu_cm_rd/wr_addr[31:0]，Dummy接口完整且纳入TP","确认Master视角起止地址、地址单位、对齐要求、data/scale访问方式选择字段及两种方式的返回有效位宽","待确认"],
  ["Q_004","mu_dsa2core_mem_legal_001","MU_DSA看到的26-bit CM地址空间与访问方式不明确","Top给出mu_cm_rd/wr_addr[25:0]，Dummy接口完整且纳入TP","确认Master视角起止地址、地址单位、对齐要求、data/scale访问方式选择字段及两种方式的返回有效位宽","待确认"],
  ["Q_005","dte_dsa2matrix_mem_legal_001","data/scale访问方式选择字段及返回有效位宽未明确","DSA视角为一个连续Matrix Memory Region；data/scale是不同访问方式而非不同Region；dte2mm物理数据总线为2048-bit","确认选择data/scale访问方式的配置或信号、两种读方式各自的返回有效位宽；若写数据或mask有效位宽也不同，一并确认","待确认"],
  ["Q_006","dte2cm/dte2mm/dte2sm/dte2mu的ST可观察完成与错误","ST侧成功/失败判定条件未完全明确","Top提供bvld/brdy、bresp及ECC error；DTE MAS定义BUS_ERR/MEM ECC ERR及错误位置","分别确认读写完成的边界信号、成功取值，以及各error信号如何映射到Exception_info/DTE_STATUS","待确认"],
  ["Q_007","vu2cm、mu2cm的ST可观察完成与错误","ST侧成功/失败判定条件未完全明确","Dummy接口完整且纳入TP；Top提供valid/ready、返回valid、rsp_err及ECC error信号","分别确认读写完成的边界信号、成功判据，以及rsp_err/ECC error的有效取值与外部可观察行为","待确认"],
];

const customProtocolRows = [
  ["rvcore2dsa","dsa_rw_ch","dsa_rw_req_vld_o","O","1","请求有效；valid且未ready期间payload保持稳定","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_rw_req_rdy_i","I","1","DSA可以接收当前读写请求","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_rw_type_o","O","1","读写类型：0=读，1=写","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_rw_addr_o","O","32","本次请求地址","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_wr_data_o","O","32","写请求数据","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_sid_o","O","4","stream_id","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_uid_o","O","16","user_id","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_tid_o","O","6","task_id","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_pid_o","O","8","path_id","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_vcid_o","O","2","vc_id","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_rd_rsp_i","I","1","读返回有效","SRC_007"],
  ["rvcore2dsa","dsa_rw_ch","dsa_rd_data_i","I","32","读返回数据，按请求顺序匹配","SRC_007"],
  ["dte2cm","read","dte2cm_rd_vld / cm2dte_rd_rdy","O/I","2 / 2","读请求握手","SRC_009"],
  ["dte2cm","read","dte2cm_rd_addr / cm2dte_rd_data","O/I","28 / 2048","读地址与返回数据","SRC_009"],
  ["dte2cm","read","cm2dte_rd_bvld / dte2cm_rd_rdy / cm2dte_rd_ecc_err","I/O/I","2 / 2 / 1","读返回握手与ECC错误","SRC_009"],
  ["dte2cm","write","dte2cm_wr_vld / cm2dte_wr_rdy","O/I","2 / 2","写请求握手","SRC_009"],
  ["dte2cm","write","dte2cm_wr_addr / dte2cm_wr_data / dte2cm_wr_bmask_en","O/O/O","28 / 2048 / 256","写地址、数据和mask","SRC_009"],
  ["dte2cm","write","cm2dte_wr_bvld / dte2cm_wr_rdy","I/O","2 / 2","写返回握手","SRC_009"],
  ["dte2cm","task-control","CFG_TRANS_MODE.transfer_mode","CFG","3","000:Router→CM；010:CM→Router；100:MM→CM时作为目的端","SRC_010"],
  ["dte2cm","task-control","CFG_ADDRn_SRC/DST / CFG_DATA_LENn","CFG","32 / 16","DTE使用全局地址，CM取低20bit；长度以1B计，段1~3须8B对齐","SRC_010"],
  ["dte2mm","read","dte2mm_rd_vld / mm2dte_rd_rdy / dte2mm_rd_addr","O/I/O","2 / 2 / 38","读请求","SRC_009"],
  ["dte2mm","read","mm2dte_rd_bvld / dte2mm_rd_rdy / mm2dte_rd_data / mm2dte_rd_ecc_err","I/O/I/I","2 / 2 / 2048 / 1","读返回与ECC错误","SRC_009"],
  ["dte2mm","write","dte2mm_wr_vld / mm2dte_wr_rdy / dte2mm_wr_addr","O/I/O","2 / 2 / 38","写请求","SRC_009"],
  ["dte2mm","write","dte2mm_wr_data / dte2mm_wr_mask / mm2dte_wr_bvld / dte2mm_wr_brdy","O/O/I/O","2048 / 256 / 2 / 2","写数据、mask与返回","SRC_009"],
  ["dte2mm","task-control","CFG_TRANS_MODE.transfer_mode","CFG","3","001:Router→MM；011:MM→Router；100:MM→CM时作为源端","SRC_010"],
  ["dte2mm","task-control","CFG_ADDRn_SRC/DST / CFG_DATA_LENn","CFG","32 / 16","DTE使用全局地址，MM取低26bit；长度以1B计，段1~3须8B对齐","SRC_010"],
  ["dte2sm","write","dte2sm_wr_vld / dte2sm_wr_rdy / dte2sm_wr_addr","O/I/O","1 / 1 / 32","写请求握手与地址","SRC_009"],
  ["dte2sm","write","dte2sm_wr_data / dte2sm_wr_bmask / sm2dte_wr_bresp / sm2dte_wr_ecc_err","O/O/I/I","32 / 4 / 1 / 1","写数据、mask和返回状态","SRC_009"],
  ["dte2sm","task-control","CFG_TRANS_MODE.wr_sharemem_flag / CFG_SM_W_ADDR / CFG_SM_W_DATA","CFG","1 / 32 / 32","Task完成后写一笔ShareMem flag；写完成后才允许通知TS","SRC_010"],
  ["dte2cm/dte2mm","task-control","CFG_TRANS_MODE.seg_valid","CFG","3","bit i使能段i+1；未使能段不参与地址形成和合法性检查；段0始终有效","SRC_010"],
  ["dte2mu","read","dte2mu_rd_vld / dte2mu_rd_rdy / dte2mu_rd_addr / dte2mu_rd_data","O/I/O/I","1 / 1 / 4 / 2048","读请求和返回数据","SRC_009"],
  ["dte2mu","read","mu2dte_rd_bvld / dte2mu_rd_brdy","I/O","1 / 1","读返回握手","SRC_009"],
  ["dte2mu","write","dte2mu_wr_vld / dte2mu_wr_rdy / dte2mu_wr_addr / dte2mu_wr_data","O/I/O/O","1 / 1 / 4 / 2048","写请求","SRC_009"],
  ["dte2mu","write","mu2dte_wr_bvld / dte2mu_wr_brdy","I/O","1 / 1","写返回握手","SRC_009"],
  ["vu2cm","read","cm_rd_req_valid / cm_rd_req_ready / cm_rd_req_addr","O/I/O","1 / 1 / 32","读请求","SRC_009"],
  ["vu2cm","read","cm_rd_rsp_valid / cm_rd_rsp_ready / cm_rd_rsp_data / cm_rd_rsp_err","I/O/I/I","1 / 1 / 1056 / 1","读返回","SRC_009"],
  ["vu2cm","write","cm_wt_req_valid / cm_wt_req_ready / cm_wt_req_addr","O/I/O","1 / 1 / 32","写请求","SRC_009"],
  ["vu2cm","write","cm_wt_req_data / cm_wt_req_be / cm_wt_rsp_valid / cm_wt_rsp_ready","O/O/I/O","1056 / 132 / 1 / 1","写数据、byte enable与返回","SRC_009"],
  ["mu2cm","read","mu2cm_rd_vld / cm2mu_rd_rdy / mu2cm_rd_addr","O/I/O","2 / 2 / 26","读请求","SRC_009"],
  ["mu2cm","read","cm2mu_rd_bvld / cm2mu_rd_data / cm2mu_rd_ecc_err","I/I/I","2 / 2112 / 1","读返回与ECC错误","SRC_009"],
  ["mu2cm","write","mu2cm_wr_vld / mu2cm_wr_addr / mu2cm_wr_data / mu2cm_wr_bmask_en","O/O/O/O","2 / 26 / 2048 / 256","写请求","SRC_009"],
];

// 基础信息
{
  const s = workbook.worksheets.add("基础信息"); s.showGridLines = false; s.tabColor = navy;
  title(s,"A2:J2","Path TP 基础信息");
  section(s,"A4:D4","输入来源");
  s.getRange("A5:D5").values=[["来源ID","输入类型","输入位置","提取内容"]]; header(s.getRange("A5:D5"));
  s.getRange(`A6:D${5+sourceRows.length}`).values=sourceRows; body(s.getRange(`A6:D${5+sourceRows.length}`));
  s.getRange(`A6:D${5+sourceRows.length}`).format.rowHeight=46;
  const start=8+sourceRows.length;
  section(s,`A${start}:J${start}`,"Master/Slave信息");
  s.getRange(`A${start+1}:J${start+1}`).values=[["对象ID","对象类型","对象名称","协议","数据宽度(bit)","地址宽度(bit)","支持操作","依据","确认状态","校准问题ID"]]; header(s.getRange(`A${start+1}:J${start+1}`));
  const displayObjects=objects.map(r=>{
    const n=[...r]; n[6]=n[6]==="READ\nWRITE"?"RW":n[6];
    if(n[1]==="Slave"){n[3]="APB"; n[4]=32; n[5]=32; n[8]="已确认"; n[9]="";}
    if(n[0]==="RV_CORE"){n[3]="Custom(rvcore2dsa)"; n[4]=32; n[5]=32; n[8]="已确认"; n[9]="";}
    return n;
  });
  s.getRange(`A${start+2}:J${start+1+displayObjects.length}`).values=displayObjects; body(s.getRange(`A${start+2}:J${start+1+displayObjects.length}`));
  s.getRange(`B${start+2}:B${start+1+objects.length}`).dataValidation={rule:{type:"list",values:["Master","Slave"]}};
  s.getRange(`D${start+2}:D${start+1+objects.length}`).dataValidation={rule:{type:"list",values:["AXI4","APB","Custom(rvcore2dsa)","Custom(dte2cm/dte2mm/dte2sm/dte2mu)","Custom(vu2cm)","Custom(mu2cm)"]}};
  s.getRange(`I${start+2}:I${start+1+objects.length}`).dataValidation={rule:{type:"list",values:["已确认","待确认"]}};
  s.getRange(`I${start+2}:I${start+1+objects.length}`).conditionalFormats.add("containsText",{text:"待确认",format:{fill:amber,font:{color:"#9C6500",bold:true}}});
  const protocolStart=start+3+displayObjects.length;
  section(s,`A${protocolStart}:G${protocolStart}`,"自定义协议");
  s.getRange(`A${protocolStart+1}:G${protocolStart+1}`).values=[["协议名称","通道","信号","方向","位宽(bit)","含义","依据"]]; header(s.getRange(`A${protocolStart+1}:G${protocolStart+1}`));
  s.getRange(`A${protocolStart+2}:G${protocolStart+1+customProtocolRows.length}`).values=customProtocolRows; body(s.getRange(`A${protocolStart+2}:G${protocolStart+1+customProtocolRows.length}`));
  s.freezePanes.freezeRows(5); widths(s,{A:16,B:12,C:68,D:45,E:14,F:14,G:16,H:24,I:12,J:18});
}

// 通路与地址空间
{
  const s=workbook.worksheets.add("通路与地址空间"); s.showGridLines=false; s.tabColor="#4472C4";
  title(s,"A2:M2","通路与地址空间");
  s.getRange("A4:M4").values=[["Master","通路ID","通路协议","起始地址","结束地址","合法条件","非法原因","测试操作","支持的访问粒度","期望响应","依据","确认状态","校准问题ID"]]; header(s.getRange("A4:M4"));
  const displayRows=pathRows.map(r=>{
    const n=[...r]; if(n[5]==="READ\nWRITE") n[5]="RW"; else if(n[5]==="WRITE") n[5]="W";
    const internal=n[0].startsWith("dte_dsa2")||n[0].startsWith("vu_dsa2")||n[0].startsWith("mu_dsa2");
    n[6]=r[0].startsWith("dte_dsa2share_mem")?"4 Byte":(r[0].startsWith("dte_dsa2core_mem")||r[0].startsWith("dte_dsa2matrix_mem"))?"长度1 Byte计；段1~3长度8 Byte对齐":internal?"待确认":"4 Byte";
    if(n[0].includes("_illegal_")) n[7]="resp=ERROR";
    if(n[7]==="正常响应" && r[0].startsWith("scp_ctrl2")) n[7]="READ:RRESP=OKAY；WRITE:BRESP=OKAY";
    if(n[7]==="正常响应" && r[0].startsWith("rv_core2")) n[7]="读:dsa_rd_rsp有效且rdata正确；写:请求被接收";
    const questionMap={Q_010:"Q_001",NEW_Q002:"Q_002",NEW_Q003:"Q_003",NEW_Q004:"Q_004",NEW_Q005:"Q_005",NEW_Q006:"Q_006",NEW_Q007:"Q_007"};
    const keep=(n[10]||"").split(",").map(q=>questionMap[q]).filter(Boolean);
    n[10]=keep.join(","); n[9]=n[10]?"待确认":"已确认";
    const master=r[0].startsWith("rv_core2")?"RV_CORE":r[0].startsWith("dte_dsa2")?"DTE_DSA":r[0].startsWith("vu_dsa2")?"VU_DSA":r[0].startsWith("mu_dsa2")?"MU_DSA":"SCP_CTRL";
    const protocol=r[0].startsWith("dte_dsa2core_mem")?"dte2cm":r[0].startsWith("dte_dsa2matrix_mem")?"dte2mm":r[0].startsWith("dte_dsa2share_mem")?"dte2sm":r[0].startsWith("dte_dsa2mu_dsa")?"dte2mu":r[0].startsWith("vu_dsa2")?"vu2cm":r[0].startsWith("mu_dsa2")?"mu2cm":r[0].startsWith("rv_core2")?"rvcore2dsa":"AXI4→目标接口";
    return [master,r[0],protocol,...n.slice(1)];
  });
  s.getRange(`A5:M${4+displayRows.length}`).values=displayRows; body(s.getRange(`A5:M${4+displayRows.length}`));
  let groupStart=5;
  for(let i=1;i<=displayRows.length;i++){
    if(i===displayRows.length||displayRows[i][0]!==displayRows[i-1][0]){
      const groupEnd=4+i; if(groupEnd>groupStart) s.getRange(`A${groupStart}:A${groupEnd}`).merge();
      s.getRange(`A${groupStart}`).values=[[displayRows[i-1][0]]]; groupStart=5+i;
    }
  }
  s.getRange(`A5:A${4+displayRows.length}`).format={fill:gray,font:{name:font,size:10,bold:true,color:"#1F1F1F"},horizontalAlignment:"center",verticalAlignment:"center",borders:{preset:"all",style:"thin",color:"#D9D9D9"}};
  s.getRange(`L5:L${4+displayRows.length}`).dataValidation={rule:{type:"list",values:["已确认","待确认"]}};
  s.getRange(`L5:L${4+displayRows.length}`).conditionalFormats.add("containsText",{text:"待确认",format:{fill:amber,font:{color:"#9C6500",bold:true}}});
  s.getRange(`B5:B${4+displayRows.length}`).conditionalFormats.add("containsText",{text:"_illegal_",format:{fill:red,font:{color:"#9C0006"}}});
  s.getRange(`B5:B${4+displayRows.length}`).conditionalFormats.add("containsText",{text:"_legal_",format:{fill:green,font:{color:"#375623"}}});
  s.freezePanes.freezeRows(4); s.freezePanes.freezeColumns(2);
  widths(s,{A:14,B:37,C:20,D:15,E:15,F:30,G:28,H:15,I:19,J:19,K:20,L:12,M:22});
}

// 验证规则
{
  const s=workbook.worksheets.add("验证规则"); s.showGridLines=false; s.tabColor="#70AD47";
  title(s,"A2:H2","验证规则选择");
  s.getRange("A4:H4").values=[["规则项ID","配置问题","可选项","工程选择","适用范围","依据","确认状态","校准问题ID"]]; header(s.getRange("A4:H4"));
  s.getRange(`A5:H${4+ruleRows.length}`).values=ruleRows; body(s.getRange(`A5:H${4+ruleRows.length}`));
  s.getRange(`D5:D${4+ruleRows.length}`).format.fill=amber;
  s.getRange(`G5:G${4+ruleRows.length}`).dataValidation={rule:{type:"list",values:["已确认","待确认"]}};
  s.getRange(`G5:G${4+ruleRows.length}`).conditionalFormats.add("containsText",{text:"待确认",format:{fill:amber,font:{color:"#9C6500",bold:true}}});
  s.freezePanes.freezeRows(4); widths(s,{A:14,B:34,C:34,D:28,E:22,F:16,G:12,H:18});
}

// DUT映射
{
  const s=workbook.worksheets.add("DUT映射"); s.showGridLines=false; s.tabColor="#A5A5A5";
  title(s,"A2:G2","DUT Module例化映射");
  s.getRange("A4:G4").values=[["通路ID","Master模块例化","中间模块例化链","Slave模块例化","依据","确认状态","校准问题ID"]]; header(s.getRange("A4:G4"));
  const knownMappings={
    dte_dsa2core_mem_legal_001:["bach_core_top.u_dte_dsa","直接信号 dte_cm_*","bach_core_top.u_core_mem"],
    dte_dsa2matrix_mem_legal_001:["bach_core_top.u_dte_dsa","直接信号 dte_mm_*","bach_core_top.u_mu_mmem"],
    dte_dsa2share_mem_legal_001:["bach_core_top.u_dte_dsa","直接信号 dte_sm_*","bach_core_top.u_shared_mem"],
    dte_dsa2mu_dsa_legal_001:["bach_core_top.u_dte_dsa","直接信号 dte_mu_*","bach_core_top.u_mu_mmem"],
    vu_dsa2core_mem_legal_001:["bach_core_top.u_vu_dsa","直接信号 vu_cm_*","bach_core_top.u_core_mem"],
    mu_dsa2core_mem_legal_001:["bach_core_top.u_mu_mmem","直接信号 mu_cm_*","bach_core_top.u_core_mem"],
  };
  const rows=pathRows.map(r=>knownMappings[r[0]]?[r[0],...knownMappings[r[0]],"SRC_009","已确认",""]:[r[0],"待提取","待提取",r[0].includes("2none_")?"NONE":"待提取","SRC_004","待确认","Q_001"]);
  s.getRange(`A5:G${4+rows.length}`).values=rows; body(s.getRange(`A5:G${4+rows.length}`));
  s.getRange(`F5:F${4+rows.length}`).dataValidation={rule:{type:"list",values:["已确认","待确认"]}};
  s.getRange(`F5:F${4+rows.length}`).conditionalFormats.add("containsText",{text:"待确认",format:{fill:amber,font:{color:"#9C6500",bold:true}}});
  s.freezePanes.freezeRows(4); s.freezePanes.freezeColumns(1); widths(s,{A:37,B:38,C:48,D:38,E:16,F:12,G:18});
}

// 校准问题
{
  const s=workbook.worksheets.add("校准问题"); s.showGridLines=false; s.tabColor="#C65911";
  title(s,"A2:F2","校准问题");
  s.getRange("A4:F4").values=[["问题ID","影响对象","问题内容","当前已知信息","需要确认内容","状态"]]; header(s.getRange("A4:F4"));
  s.getRange(`A5:F${4+calibrationRows.length}`).values=calibrationRows; body(s.getRange(`A5:F${4+calibrationRows.length}`));
  s.getRange(`F5:F${4+calibrationRows.length}`).dataValidation={rule:{type:"list",values:["待确认"]}};
  s.getRange(`F5:F${4+calibrationRows.length}`).conditionalFormats.add("containsText",{text:"待确认",format:{fill:amber,font:{color:"#9C6500",bold:true}}});
  s.freezePanes.freezeRows(4); widths(s,{A:12,B:24,C:31,D:34,E:48,F:13});
}

for (const s of workbook.worksheets.items) {
  const used=s.getUsedRange();
  used.format.verticalAlignment="center";
  used.format.font.name=font;
}

workbook.recalculate();
await fs.mkdir(path.dirname(outputPath),{recursive:true});
await fs.mkdir(previewDir,{recursive:true});
for (const s of workbook.worksheets.items) {
  const image=await workbook.render({sheetName:s.name,autoCrop:"all",scale:1,format:"png"});
  await fs.writeFile(path.join(previewDir,`${s.name}.png`),new Uint8Array(await image.arrayBuffer()));
}
const output=await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const inspect=await workbook.inspect({kind:"sheet,table",maxChars:5000,tableMaxRows:8,tableMaxCols:12});
console.log(inspect.ndjson);
console.log(outputPath);
