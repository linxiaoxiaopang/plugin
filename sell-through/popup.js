(function () {
  'use strict';

  // ==================== DOM refs ====================
  const tabGenerate = document.getElementById('tabGenerate');
  const tabValidate = document.getElementById('tabValidate');
  const modeGenerate = document.getElementById('modeGenerate');
  const modeValidate = document.getElementById('modeValidate');

  // Generate mode
  const fileInput = document.getElementById('fileInput');
  const fileStatus = document.getElementById('fileStatus');
  const templateInput = document.getElementById('templateInput');
  const templateStatus = document.getElementById('templateStatus');
  const invInput = document.getElementById('invInput');
  const invStatus = document.getElementById('invStatus');
  const refDateInput = document.getElementById('refDate');
  const generateBtn = document.getElementById('generateBtn');
  const genProgress = document.getElementById('genProgress');
  const genProgressText = document.getElementById('genProgressText');
  const genResult = document.getElementById('genResult');
  const genResultText = document.getElementById('genResultText');
  const downloadBtn = document.getElementById('downloadBtn');

  // Validate mode
  const valSourceInput = document.getElementById('valSourceInput');
  const valSourceStatus = document.getElementById('valSourceStatus');
  const valCheckInput = document.getElementById('valCheckInput');
  const valCheckStatus = document.getElementById('valCheckStatus');
  const validateBtn = document.getElementById('validateBtn');
  const valProgress = document.getElementById('valProgress');
  const valProgressText = document.getElementById('valProgressText');
  const valResult = document.getElementById('valResult');
  const valResultText = document.getElementById('valResultText');
  const valDownloadBtn = document.getElementById('valDownloadBtn');

  // Inventory Validate mode
  const tabInvValidate = document.getElementById('tabInvValidate');
  const modeInvValidate = document.getElementById('modeInvValidate');
  const invValSourceInput = document.getElementById('invValSourceInput');
  const invValSourceStatus = document.getElementById('invValSourceStatus');
  const invValRefInput = document.getElementById('invValRefInput');
  const invValRefStatus = document.getElementById('invValRefStatus');
  const invValidateBtn = document.getElementById('invValidateBtn');
  const invValProgress = document.getElementById('invValProgress');
  const invValProgressText = document.getElementById('invValProgressText');
  const invValResult = document.getElementById('invValResult');
  const invValResultText = document.getElementById('invValResultText');
  const invValDownloadBtn = document.getElementById('invValDownloadBtn');

  // ==================== State ====================
  let rawOrders = null;
  let templateWB = null;
  let templateReady = false;
  let inventoryMap = null;

  let valSourceWB = null;
  let valCheckWB = null;
  let valReady = false;

  let invValSourceWB = null;
  let invValRefWB = null;
  let invValReady = false;

  // ==================== Init ====================
  const today = new Date();
  let y = today.getFullYear();
  let m = today.getMonth();
  if (today.getDate() <= 25) {
    m--;
    if (m < 0) { m = 11; y--; }
  }
  const lastDay = new Date(y, m + 1, 0);
  const y2 = lastDay.getFullYear();
  const m2 = lastDay.getMonth() + 1;
  const d2 = lastDay.getDate();
  refDateInput.value = y2 + '-' + String(m2).padStart(2, '0') + '-' + String(d2).padStart(2, '0');

  // Set validate reference date to same default
  const valRefDateEl = document.getElementById('valRefDate');
  valRefDateEl.value = refDateInput.value;

  // ==================== Tab switching ====================
  function switchMode(mode) {
    tabGenerate.classList.toggle('active', mode === 'generate');
    tabValidate.classList.toggle('active', mode === 'validate');
    tabInvValidate.classList.toggle('active', mode === 'invValidate');
    modeGenerate.classList.toggle('hidden', mode !== 'generate');
    modeValidate.classList.toggle('hidden', mode !== 'validate');
    modeInvValidate.classList.toggle('hidden', mode !== 'invValidate');
  }

  tabGenerate.addEventListener('click', function () { switchMode('generate'); });
  tabValidate.addEventListener('click', function () { switchMode('validate'); });
  tabInvValidate.addEventListener('click', function () { switchMode('invValidate'); });

  // ==================== Generate: file handlers ====================
  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      fileStatus.textContent = '未选择文件';
      fileStatus.className = 'status';
      rawOrders = null;
      checkGenReady();
      return;
    }
    fileStatus.textContent = '读取中 ' + file.name + '...';
    fileStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        rawOrders = await parseOrders(new Uint8Array(evt.target.result));
        fileStatus.textContent = '已加载: ' + file.name + ' (' + rawOrders.length + ' 条有效订单)';
        fileStatus.className = 'status ok';
        checkGenReady();
      } catch (err) {
        fileStatus.textContent = '错误: ' + err.message;
        fileStatus.className = 'status error';
        rawOrders = null;
        checkGenReady();
      }
    };
    reader.onerror = function () {
      fileStatus.textContent = '读取文件失败';
      fileStatus.className = 'status error';
      rawOrders = null;
      checkGenReady();
    };
    reader.readAsArrayBuffer(file);
  });

  templateInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      templateStatus.textContent = '未选择模板';
      templateStatus.className = 'status';
      templateWB = null;
      templateReady = false;
      checkGenReady();
      return;
    }
    templateStatus.textContent = '读取模板 ' + file.name + '...';
    templateStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        templateWB = new ExcelJS.Workbook();
        await templateWB.xlsx.load(evt.target.result);
        templateReady = true;
        templateStatus.textContent = '模板已加载: ' + file.name;
        templateStatus.className = 'status ok';
        checkGenReady();
      } catch (err) {
        templateStatus.textContent = '错误: ' + err.message;
        templateStatus.className = 'status error';
        templateWB = null;
        templateReady = false;
        checkGenReady();
      }
    };
    reader.readAsArrayBuffer(file);
  });

  invInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      invStatus.textContent = '未选择文件';
      invStatus.className = 'status';
      inventoryMap = null;
      return;
    }
    invStatus.textContent = '读取中 ' + file.name + '...';
    invStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        inventoryMap = await parseInventory(new Uint8Array(evt.target.result));
        invStatus.textContent = '已加载: ' + file.name + ' (' + inventoryMap.size + ' 个SKU)';
        invStatus.className = 'status ok';
      } catch (err) {
        invStatus.textContent = '错误: ' + err.message;
        invStatus.className = 'status error';
        inventoryMap = null;
      }
    };
    reader.onerror = function () {
      invStatus.textContent = '读取文件失败';
      invStatus.className = 'status error';
      inventoryMap = null;
    };
    reader.readAsArrayBuffer(file);
  });

  function checkGenReady() {
    generateBtn.disabled = !(rawOrders && templateReady);
  }

  // ==================== Generate: run ====================
  generateBtn.addEventListener('click', function () {
    if (!rawOrders || !templateWB) return;
    const refDateStr = refDateInput.value;
    if (!refDateStr) { alert('请选择参考日期。'); return; }
    const refDate = new Date(refDateStr + 'T23:59:59');
    if (isNaN(refDate.getTime())) { alert('参考日期无效。'); return; }

    genProgress.classList.remove('hidden');
    genResult.classList.add('hidden');
    generateBtn.disabled = true;

    setTimeout(function () {
      try {
        if (inventoryMap) {
          genProgressText.textContent = '在售库存已加载 (' + inventoryMap.size + ' 个SKU)';
        }
        fillTemplate(rawOrders, templateWB, refDate, inventoryMap);
      } catch (err) {
        genProgress.classList.add('hidden');
        generateBtn.disabled = false;
        alert('错误: ' + err.message);
      }
    }, 50);
  });

  downloadBtn.addEventListener('click', function () {
    const blob = downloadBtn._blob;
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nowStr() + '_DNG_已填充.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });

  // ==================== Validate: file handlers ====================
  valSourceInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      valSourceStatus.textContent = '未选择文件';
      valSourceStatus.className = 'status';
      valSourceWB = null;
      checkValReady();
      return;
    }
    valSourceStatus.textContent = '读取中...';
    valSourceStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        valSourceWB = new ExcelJS.Workbook();
        await valSourceWB.xlsx.load(evt.target.result);
        valSourceStatus.textContent = '已加载: ' + file.name;
        valSourceStatus.className = 'status ok';
        checkValReady();
      } catch (err) {
        valSourceStatus.textContent = '错误: ' + err.message;
        valSourceStatus.className = 'status error';
        valSourceWB = null;
        checkValReady();
      }
    };
    reader.readAsArrayBuffer(file);
  });

  valCheckInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      valCheckStatus.textContent = '未选择文件';
      valCheckStatus.className = 'status';
      valCheckWB = null;
      checkValReady();
      return;
    }
    valCheckStatus.textContent = '读取中...';
    valCheckStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        valCheckWB = new ExcelJS.Workbook();
        await valCheckWB.xlsx.load(evt.target.result);
        valCheckStatus.textContent = '已加载: ' + file.name;
        valCheckStatus.className = 'status ok';
        checkValReady();
      } catch (err) {
        valCheckStatus.textContent = '错误: ' + err.message;
        valCheckStatus.className = 'status error';
        valCheckWB = null;
        checkValReady();
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // ==================== Inventory Validate: file handlers ====================
  invValSourceInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      invValSourceStatus.textContent = '未选择文件';
      invValSourceStatus.className = 'status';
      invValSourceWB = null;
      checkInvValReady();
      return;
    }
    invValSourceStatus.textContent = '读取中...';
    invValSourceStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        invValSourceWB = new ExcelJS.Workbook();
        await invValSourceWB.xlsx.load(evt.target.result);
        invValSourceStatus.textContent = '已加载: ' + file.name;
        invValSourceStatus.className = 'status ok';
        checkInvValReady();
      } catch (err) {
        invValSourceStatus.textContent = '错误: ' + err.message;
        invValSourceStatus.className = 'status error';
        invValSourceWB = null;
        checkInvValReady();
      }
    };
    reader.readAsArrayBuffer(file);
  });

  invValRefInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
      invValRefStatus.textContent = '未选择文件';
      invValRefStatus.className = 'status';
      invValRefWB = null;
      checkInvValReady();
      return;
    }
    invValRefStatus.textContent = '读取中...';
    invValRefStatus.className = 'status';
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        invValRefWB = new ExcelJS.Workbook();
        await invValRefWB.xlsx.load(evt.target.result);
        invValRefStatus.textContent = '已加载: ' + file.name;
        invValRefStatus.className = 'status ok';
        checkInvValReady();
      } catch (err) {
        invValRefStatus.textContent = '错误: ' + err.message;
        invValRefStatus.className = 'status error';
        invValRefWB = null;
        checkInvValReady();
      }
    };
    reader.readAsArrayBuffer(file);
  });

  function checkInvValReady() {
    invValidateBtn.disabled = !(invValSourceWB && invValRefWB);
  }

  function checkValReady() {
    validateBtn.disabled = !(valSourceWB && valCheckWB);
  }

  // ==================== Validate: run ====================
  validateBtn.addEventListener('click', function () {
    if (!valSourceWB || !valCheckWB) return;
    valProgress.classList.remove('hidden');
    valResult.classList.add('hidden');
    validateBtn.disabled = true;
    setTimeout(function () {
      try {
        validate30DayCounts();
      } catch (err) {
        valProgress.classList.add('hidden');
        validateBtn.disabled = false;
        alert('错误: ' + err.message);
      }
    }, 50);
  });

  valDownloadBtn.addEventListener('click', function () {
    const blob = valDownloadBtn._blob;
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nowStr() + '_校验文件_已标色.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });

  // ==================== Inventory Validate: run ====================
  invValidateBtn.addEventListener('click', function () {
    if (!invValSourceWB || !invValRefWB) return;
    invValProgress.classList.remove('hidden');
    invValResult.classList.add('hidden');
    invValidateBtn.disabled = true;
    setTimeout(function () {
      try {
        validateInventory();
      } catch (err) {
        invValProgress.classList.add('hidden');
        invValidateBtn.disabled = false;
        alert('错误: ' + err.message);
      }
    }, 50);
  });

  invValDownloadBtn.addEventListener('click', function () {
    const blob = invValDownloadBtn._blob;
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nowStr() + '_在售校验_已标差异.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });

  // ================================================================
  //  INVENTORY VALIDATE: compare 在售数量 between template and source
  // ================================================================

  function validateInventory() {
    invValProgressText.textContent = '解析源文件...';

    const srcWS = invValSourceWB.worksheets[0];  // FBA 在售库存.xlsx (待标注)
    const chkWS = invValRefWB.worksheets[0];     // 已填充的动销表.xlsx (参考)
    if (!srcWS || !chkWS) throw new Error('文件缺少工作表');

    // ---- Parse source (FBA 在售库存.xlsx): SKU -> { quantity, row } ----
    const srcMap = new Map();
    srcWS.eachRow(function (row, rowNum) {
      if (rowNum === 1) return;
      const sku = (row.getCell(1).value || '').toString().trim();
      const qty = parseInt(row.getCell(2).value, 10);
      if (!sku) return;
      srcMap.set(sku, { value: isNaN(qty) ? null : qty, row: rowNum });
    });

    invValProgressText.textContent = '解析校验文件 (' + srcMap.size + ' 个SKU)...';

    // ---- Parse check file (filled template): find SKU + 在售数量 columns ----
    const chkHdrRow = findHeaderRow(chkWS, 'SKU', 10);
    if (chkHdrRow === -1) throw new Error('校验文件前10行未找到 SKU 表头');

    const groups = [];
    const chkMaxCol = chkWS.columnCount || 95;
    for (let c = 1; c <= chkMaxCol; c++) {
      const hv = chkWS.getCell(chkHdrRow, c).value;
      if (!hv) continue;
      if (hv.toString().toUpperCase() === 'SKU') {
        const grp = { skuCol: c, invCol: null };
        for (let d = 1; d <= 5; d++) {
          const h = chkWS.getCell(chkHdrRow, c + d).value;
          if (!h) continue;
          if (h.toString() === '在售数量') {
            grp.invCol = c + d;
            break;
          }
        }
        groups.push(grp);
      }
    }
    if (groups.length === 0) throw new Error(
      '校验文件第' + chkHdrRow + '行未找到 在售数量 列');

    // ---- Build check map: SKU -> value ----
    const chkMap = new Map();
    for (let r = 3; r <= chkWS.rowCount; r++) {
      let rowEmpty = true;
      for (const g of groups) {
        const sv = chkWS.getCell(r, g.skuCol).value;
        if (!sv) continue;
        const sku = sv.toString().trim();
        if (!sku) continue;
        rowEmpty = false;
        const tVal = chkWS.getCell(r, g.invCol).value;
        chkMap.set(sku, tVal !== null && tVal !== undefined ? tVal : null);
      }
      if (rowEmpty) break;
    }

    invValProgressText.textContent = '对比差异...';

    // ---- Compare (iterate over source SKUs) ----
    let matchCount = 0;
    let diffCount = 0;
    let missingCount = 0;
    const diffMap = new Map(); // SKU -> diff string

    for (const [sku, srcInfo] of srcMap) {
      const sVal = srcInfo.value;
      const tVal = chkMap.has(sku) ? chkMap.get(sku) : undefined;

      if (tVal === undefined) {
        diffMap.set(sku, '校验文件无此SKU');
        missingCount++;
      } else if (sVal === null && tVal !== null) {
        diffMap.set(sku, '源文件数量为空');
        diffCount++;
      } else if (tVal === null && sVal !== null) {
        diffMap.set(sku, '模板未填充');
        diffCount++;
      } else if (sVal !== tVal) {
        diffMap.set(sku, '源文件=' + (sVal === null ? '空' : sVal) + ', 模板=' + (tVal === null ? '空' : tVal));
        diffCount++;
      } else {
        matchCount++;
      }
    }

    invValProgressText.textContent = '写入差异说明...';

    // ---- Write diff column to SOURCE file (FBA 在售库存) ----
    srcWS.getCell(1, 3).value = '在售差异';

    for (const [sku, diff] of diffMap) {
      const info = srcMap.get(sku);
      srcWS.getCell(info.row, 3).value = diff;
    }

    invValProgressText.textContent = '生成下载文件...';

    // ---- Export source file ----
    invValSourceWB.xlsx.writeBuffer().then(function (buffer) {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      invValDownloadBtn._blob = blob;

      invValProgress.classList.add('hidden');
      invValidateBtn.disabled = false;

      invValResultText.innerHTML = '在售校验完成<br>'
        + '总SKU: ' + srcMap.size
        + ' | 一致: ' + matchCount
        + ' | 差异: ' + diffCount
        + ' | 校验文件无此SKU: ' + missingCount;
      invValResult.classList.remove('hidden');
    });
  }

  // ================================================================
  //  VALIDATE: compare 30-day counts between source and check file
  // ================================================================

  function validate30DayCounts() {
    // ---- Read reference date ----
    const valRefDateStr = document.getElementById('valRefDate').value;
    if (!valRefDateStr) {
      alert('请选择参考日期。');
      valProgress.classList.add('hidden');
      validateBtn.disabled = false;
      return;
    }
    const valRefDate = new Date(valRefDateStr + 'T23:59:59');
    if (isNaN(valRefDate.getTime())) {
      alert('参考日期无效。');
      valProgress.classList.add('hidden');
      validateBtn.disabled = false;
      return;
    }

    valProgressText.textContent = '解析源文件...';

    const srcWS = valSourceWB.worksheets[0];
    const chkWS = valCheckWB.worksheets[0];
    let srcHdrRow;
    if (!srcWS || !chkWS) throw new Error('文件缺少工作表');

    // ---- Parse source: find SKU columns ----
    srcHdrRow = findHeaderRow(srcWS, 'SKU', 10);
    if (srcHdrRow === -1) throw new Error(
      '源文件前10行未找到 SKU 表头');
    const maxCol = srcWS.columnCount || 89;
    let srcSkuCols = [];

    for (let c = 1; c <= maxCol; c++) {
      const hv = srcWS.getCell(srcHdrRow, c).value;
      if (!hv) continue;
      if (/SKU/i.test(hv.toString())) {
        srcSkuCols.push(c);
      }
    }

    if (srcSkuCols.length === 0) throw new Error(
      '源文件第' + srcHdrRow + '行未找到 SKU 表头 (已扫描A~' + colToLetter(maxCol) + '列)');

    // ---- Read source: SKU -> 30d count ----
    const srcMap = new Map();
    const srcMaxRow = srcWS.rowCount;

    for (let r = 3; r <= srcMaxRow; r++) {
      let hasSku = false;
      for (const sc of srcSkuCols) {
        const sv = srcWS.getCell(r, sc).value;
        if (!sv) continue;
        const sku = sv.toString().trim();
        if (!sku) continue;
        hasSku = true;
        const d30v = parseFloat(srcWS.getCell(r, sc + 4).value) || 0;
        if (d30v > 0) {
          srcMap.set(sku, d30v);
        }
      }
      if (!hasSku) break;
    }

    valProgressText.textContent = '对比校验文件 (' + srcMap.size + ' 个SKU)...';

    // ---- Parse check file: find SKU column ----
    const chkMaxCol = chkWS.columnCount || 50;
    const chkHdrRow = findHeaderRow(chkWS, 'SKU', 10);
    if (chkHdrRow === -1) throw new Error('校验文件前10行未找到 SKU 列');

    let checkSkuCol = null;
    for (let c = 1; c <= chkMaxCol; c++) {
      const hv = chkWS.getCell(chkHdrRow, c).value;
      if (hv && /SKU/i.test(hv.toString())) {
        checkSkuCol = c;
        break;
      }
    }
    if (!checkSkuCol) throw new Error(
      '校验文件第' + chkHdrRow + '行未找到 SKU 列 (已扫描A~' + colToLetter(chkMaxCol) + '列)');

    // ---- Find "下单时间" column in check file ----
    let checkDateCol = null;
    for (let c = 1; c <= chkMaxCol; c++) {
      const hv = chkWS.getCell(chkHdrRow, c).value;
      if (hv && hv.toString().trim() === '下单时间') {
        checkDateCol = c;
        break;
      }
    }
    if (!checkDateCol) throw new Error(
      '校验文件第' + chkHdrRow + '行未找到"下单时间"列 (已扫描A~' + colToLetter(chkMaxCol) + '列)');

    // ---- Count SKU occurrences in check file (filtered by 30-day window) ----
    const checkCount = new Map();  // SKU -> count of rows
    const checkRows = new Map();   // SKU -> array of row numbers
    const chkMaxRow = chkWS.rowCount;

    for (let r = 2; r <= chkMaxRow; r++) {
      const sv = chkWS.getCell(r, checkSkuCol).value;
      if (!sv) continue;
      const sku = sv.toString().trim();
      if (!sku) continue;

      // Filter by "下单时间" 30-day window
      const dateRaw = chkWS.getCell(r, checkDateCol).value;
      let orderDate = null;
      if (typeof dateRaw === 'number') {
        orderDate = dateFromSerial(dateRaw);
      } else if (typeof dateRaw === 'string' && dateRaw) {
        orderDate = new Date(dateRaw);
      } else if (dateRaw instanceof Date) {
        orderDate = dateRaw;
      }
      if (!orderDate || isNaN(orderDate.getTime())) {
        if (r <= 5) console.log('VAL Row', r, 'SKU:', sku, 'INVALID DATE - SKIPPED');
        continue;
      }
      const d = Math.floor((valRefDate - orderDate) / 86400000);
      if (r <= 5) {
        console.log('VAL Row', r, 'SKU:', sku, 'dateRaw:', dateRaw,
          'orderDate:', orderDate, 'dayDiff:', d, d >= 0 && d <= 29 ? 'KEEP' : 'SKIP');
      }
      if (d < 0 || d > 29) continue;

      checkCount.set(sku, (checkCount.get(sku) || 0) + 1);
      if (!checkRows.has(sku)) checkRows.set(sku, []);
      checkRows.get(sku).push(r);
    }

    let totalRows = 0;
    for (const cnt of checkCount.values()) totalRows += cnt;
    console.log('扫描总行数:', chkMaxRow - 1, '| 过滤后行数:', totalRows,
      '| 过滤比例:', ((chkMaxRow - 1 - totalRows) / (chkMaxRow - 1) * 100).toFixed(1) + '%');

    valProgressText.textContent = '写入差异说明...';

    // ---- Compare and write diff column ----
    let matchCount = 0;
    let extraSkuCount = 0;
    let missSkuCount = 0;

    // Find last used column in check file
    let lastCol = 0;
    for (let c = 1; c <= chkMaxCol; c++) {
      const hv = chkWS.getCell(chkHdrRow, c).value;
      if (hv) lastCol = c;
    }
    const diffCol = lastCol + 1;
    chkWS.getCell(chkHdrRow, diffCol).value = '差异说明';

    // Build lookup: SKU -> diff string (cache)
    const skuDiff = new Map();
    const allSkus = new Set([...srcMap.keys(), ...checkCount.keys()]);

    for (const sku of allSkus) {
      const N = srcMap.get(sku) || 0;
      const M = checkCount.get(sku) || 0;

      if (M === N) {
        matchCount++;
        continue;
      }
      if (M > N) {
        if (N === 0) {
          skuDiff.set(sku, '源表不存在');
        } else {
          skuDiff.set(sku, '多' + (M - N) + '行');
        }
        extraSkuCount++;
      } else {
        skuDiff.set(sku, '少' + (N - M) + '行');
        missSkuCount++;
      }
    }

    // Write diff only to rows that passed date filter
    for (const [sku, rows] of checkRows) {
      const diff = skuDiff.get(sku);
      if (!diff) continue;
      for (const r of rows) {
        chkWS.getCell(r, diffCol).value = diff;
      }
    }

    valProgressText.textContent = '生成下载文件...';

    // ---- Export ----
    valCheckWB.xlsx.writeBuffer().then(function (buffer) {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      valDownloadBtn._blob = blob;

      valProgress.classList.add('hidden');
      validateBtn.disabled = false;

      valResultText.innerHTML = '校验完成 (已按参考日期过滤30天数据)<br>'
        + '总SKU: ' + allSkus.size
        + ' | 一致: ' + matchCount
        + ' | 多行: ' + extraSkuCount + ' SKU'
        + ' | 少行: ' + missSkuCount + ' SKU';
      valResult.classList.remove('hidden');
    });
  }

  // ================================================================
  //  GENERATE: fill template with sales data
  // ================================================================

  function fillTemplate(orders, tmplWB, refDate, inventoryMap) {
    genProgressText.textContent = '聚合订单...';

    const skuMap = new Map();
    for (const ord of orders) {
      const dayDiff = Math.floor((refDate - ord.date) / (24 * 60 * 60 * 1000));
      if (dayDiff < 0 || dayDiff >= 30) continue;
      if (!skuMap.has(ord.sku)) {
        skuMap.set(ord.sku, { d7: 0, d14: 0, d30: 0 });
      }
      const rec = skuMap.get(ord.sku);
      if (dayDiff <= 6)   rec.d7++;
      if (dayDiff <= 13)  rec.d14++;
      if (dayDiff <= 29)  rec.d30++;
    }

    genProgressText.textContent = '扫描模板SKU位置...';

    const ws = tmplWB.worksheets[0];
    if (!ws) throw new Error('模板没有工作表');

    const groupDefs = [];
    const maxCol = ws.columnCount || 89;
    const hdrRow = findHeaderRow(ws, 'SKU', 10);
    if (hdrRow === -1) throw new Error('模板前10行未找到 SKU 表头');

    for (let c = 1; c <= maxCol; c++) {
      const hv = ws.getCell(hdrRow, c).value;
      if (hv && hv.toString().toUpperCase() === 'SKU') {
        const grp = { skuCol: c, col7: [], col14: null, col30: null, invCol: null };
        for (let d = 1; d <= 5; d++) {
          const h = ws.getCell(hdrRow, c + d).value;
          if (!h) continue;
          const hs = h.toString();
          if (/7/.test(hs))       grp.col7.push(c + d);
          if (/14/.test(hs))      grp.col14 = c + d;
          if (/30/.test(hs))      grp.col30 = c + d;
          if (hs === '在售数量')   grp.invCol = c + d;
        }
        groupDefs.push(grp);
      }
    }

    if (groupDefs.length === 0) throw new Error(
      '模板第' + hdrRow + '行未找到SKU表头');

    genProgressText.textContent = '填充数据 (' + groupDefs.length + ' 组)...';

    let filledCount = 0;
    let invFilledCount = 0;
    let totalSkus = 0;

    for (let r = 3; r <= ws.rowCount; r++) {
      for (const g of groupDefs) {
        const sv = ws.getCell(r, g.skuCol).value;
        if (!sv) continue;
        const sku = sv.toString().trim();
        if (!sku) continue;
        totalSkus++;
        const data = skuMap.get(sku);
        if (data) {
          for (const col of g.col7)  ws.getCell(r, col).value = data.d7 || 0;
          if (g.col14)               ws.getCell(r, g.col14).value = data.d14 || 0;
          if (g.col30)               ws.getCell(r, g.col30).value = data.d30 || 0;
          filledCount++;
        }
        if (inventoryMap && g.invCol) {
          const inv = inventoryMap.get(sku);
          if (inv !== undefined) {
            ws.getCell(r, g.invCol).value = inv;
            invFilledCount++;
          }
        }
      }
    }

    genProgressText.textContent = '生成文件...';

    tmplWB.xlsx.writeBuffer().then(function (buffer) {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      downloadBtn._blob = blob;

      genProgress.classList.add('hidden');
      generateBtn.disabled = false;

      let invMsg = '';
      if (inventoryMap) {
        invMsg = ' | 在售数量填充 ' + invFilledCount + ' 个SKU';
      }
      genResultText.textContent = '完成！销量填充 ' + filledCount + ' / ' + totalSkus + ' 个模板SKU' + invMsg;
      genResult.classList.remove('hidden');
    });
  }

  // ================================================================
  //  Parse orders from source xlsx
  // ================================================================

  async function parseOrders(uint8arr) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(uint8arr.buffer);

    let ws = wb.getWorksheet('order_1');
    if (!ws) ws = wb.worksheets[0];
    if (!ws) throw new Error('未找到工作表');

    const orders = [];
    ws.eachRow(function (row, rowNum) {
      if (rowNum === 1) return;
      const sku = (row.getCell(2).value || '').toString().trim();
      const dateRaw = row.getCell(3).value;
      if (!sku) return;

      let orderDate = null;
      if (typeof dateRaw === 'number') {
        orderDate = dateFromSerial(dateRaw);
      } else if (typeof dateRaw === 'string' && dateRaw) {
        orderDate = new Date(dateRaw);
      } else if (dateRaw instanceof Date) {
        orderDate = dateRaw;
      }
      if (!orderDate || isNaN(orderDate.getTime())) return;
      orders.push({ sku: sku, date: orderDate });
    });
    return orders;
  }

  async function parseInventory(uint8arr) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(uint8arr.buffer);

    const ws = wb.worksheets[0];
    if (!ws) throw new Error('未找到工作表');

    const map = new Map();
    ws.eachRow(function (row, rowNum) {
      if (rowNum === 1) return;
      const sku = (row.getCell(1).value || '').toString().trim();
      const qty = parseInt(row.getCell(2).value, 10) || 0;
      if (!sku) return;
      map.set(sku, qty);
    });
    return map;
  }

  function dateFromSerial(serial) {
    if (serial < 0) return null;
    const epoch = new Date(1899, 11, 30);
    const d = new Date(epoch.getTime() + serial * 24 * 60 * 60 * 1000);
    if (serial >= 60) d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
    return d;
  }

  function findHeaderRow(ws, keyword, maxScan) {
    const maxCol = ws.columnCount || 50;
    for (let r = 1; r <= maxScan; r++) {
      for (let c = 1; c <= maxCol; c++) {
        const v = ws.getCell(r, c).value;
        if (!v) continue;
        if (v.toString().indexOf(keyword) !== -1) return r;
      }
    }
    return -1;
  }

  function colToLetter(col) {
    let s = '';
    while (col > 0) {
      col--;
      s = String.fromCharCode(65 + (col % 26)) + s;
      col = Math.floor(col / 26);
    }
    return s;
  }

  function nowStr() {
    const d = new Date();
    return d.getFullYear()
      + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0')
      + '_'
      + String(d.getHours()).padStart(2, '0')
      + String(d.getMinutes()).padStart(2, '0')
      + String(d.getSeconds()).padStart(2, '0');
  }

})();
