import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Target, Activity, Save, Download, Trash2 } from 'lucide-react';

/*
  사용 방법:
  1. HTML 파일의 <head> 태그에 다음 스크립트 추가:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  
  2. 또는 npm/yarn으로 설치:
     npm install xlsx
     import * as XLSX from 'xlsx';
*/

const ProfitabilityDashboard = () => {
  const [cvr, setCvr] = useState(2);
  const [ctr, setCtr] = useState(1.5);
  const [budget, setBudget] = useState(5000000);
  const [aov, setAov] = useState(150000);
  const [cpc, setCpc] = useState(1000);
  const [baseCpc] = useState(1000); // 기준 CPC (CTR 1.5%일 때)
  const [costRate, setCostRate] = useState(30);
  const [savedScenarios, setSavedScenarios] = useState([]);

  // XLSX 라이브러리 동적 로드
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      script.onload = () => {
        console.log('XLSX library loaded');
      };
      document.body.appendChild(script);
    }
  }, []);

  // CTR-CPC 상호 영향 계산
  const calculateCpcFromCtr = (ctrValue) => {
    const baselineCTR = 1.5;
    const ctrMultiplier = ctrValue / baselineCTR;
    // CTR이 2배가 되면 CPC는 약 20% 감소
    const adjustedCPC = baseCpc / (1 + (ctrMultiplier - 1) * 0.2);
    return Math.round(adjustedCPC / 10) * 10; // 10원 단위로 반올림
  };

  const calculateCtrFromCpc = (cpcValue) => {
    const baselineCTR = 1.5;
    // CPC 비율에서 CTR 역계산
    const cpcRatio = baseCpc / cpcValue;
    const ctrValue = baselineCTR * (1 + (cpcRatio - 1) * 5); // CPC가 20% 감소하면 CTR은 100% 증가
    return Math.round(ctrValue * 10) / 10; // 0.1% 단위로 반올림
  };

  // CTR 변경 시 CPC 자동 조정
  const handleCtrChange = (newCtr) => {
    setCtr(newCtr);
    const newCpc = calculateCpcFromCtr(newCtr);
    setCpc(newCpc);
  };

  // CPC 변경 시 CTR 자동 조정
  const handleCpcChange = (newCpc) => {
    setCpc(newCpc);
    const newCtr = calculateCtrFromCpc(newCpc);
    setCtr(newCtr);
  };

  // 숫자 포맷 함수
  const formatNumber = (num) => {
    return Math.round(num).toLocaleString();
  };

  const formatCurrency = (num) => {
    return '₩' + formatNumber(num);
  };

  // 계산 함수
  const calculateMetrics = () => {
    const cvrDecimal = cvr / 100;
    const ctrDecimal = ctr / 100;
    const costRateDecimal = costRate / 100;

    // 현재 설정된 CPC 사용 (이미 CTR과 연동되어 있음)
    const clicks = budget / cpc;
    const impressions = clicks / ctrDecimal;
    const conversions = clicks * cvrDecimal;
    const actualRevenue = conversions * aov;
    const actualRoas = actualRevenue / budget;

    // 비용 지표
    const cpa = conversions > 0 ? budget / conversions : 0;
    const cpm = impressions > 0 ? (budget / impressions) * 1000 : 0;

    // 수익성 계산
    const cogs = actualRevenue * costRateDecimal;
    const grossProfit = actualRevenue - cogs;
    const grossMargin = actualRevenue > 0 ? (grossProfit / actualRevenue) * 100 : 0;
    const netProfit = grossProfit - budget;
    const netMargin = actualRevenue > 0 ? (netProfit / actualRevenue) * 100 : 0;
    const roi = (netProfit / budget) * 100;

    // 손익분기점
    const breakevenRoas = 1 / (1 - costRateDecimal);
    const safetyMargin = ((actualRoas - breakevenRoas) / breakevenRoas) * 100;

    return {
      targetRevenue: actualRevenue,
      actualRevenue,
      actualRoas,
      conversions,
      clicks,
      impressions,
      cpc,
      cpa,
      cpm,
      cogs,
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
      roi,
      breakevenRoas,
      safetyMargin
    };
  };

  const metrics = calculateMetrics();

  // CVR별 손익분기점 데이터
  const generateCvrBreakevenData = () => {
    const data = [];
    for (let testCvr = 0.5; testCvr <= 5; testCvr += 0.5) {
      const cvrDecimal = testCvr / 100;
      const clicks = budget / cpc;
      const conversions = clicks * cvrDecimal;
      const revenue = conversions * aov;
      const cogs = revenue * (costRate / 100);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - budget;
      const actualRoas = revenue / budget;
      
      data.push({
        CVR: testCvr,
        매출: revenue,
        순이익: netProfit,
        ROAS: actualRoas,
        상태: netProfit >= 0 ? '흑자' : '적자'
      });
    }
    return data;
  };

  // CPC별 손익분기점 데이터
  const generateCpcBreakevenData = () => {
    const data = [];
    for (let testCpc = 500; testCpc <= 3000; testCpc += 250) {
      const clicks = budget / testCpc;
      const conversions = clicks * (cvr / 100);
      const revenue = conversions * aov;
      const cogs = revenue * (costRate / 100);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - budget;
      const actualRoas = revenue / budget;
      
      data.push({
        CPC: testCpc,
        클릭수: Math.round(clicks),
        전환수: Math.round(conversions),
        순이익: netProfit,
        ROAS: actualRoas,
        상태: netProfit >= 0 ? '흑자' : '적자'
      });
    }
    return data;
  };

  // 시나리오 저장
  const saveScenario = () => {
    const newScenario = {
      id: Date.now(),
      저장시간: new Date().toLocaleString('ko-KR'),
      CVR: cvr,
      CTR: ctr,
      예산: budget,
      객단가: aov,
      CPC: cpc,
      원가율: costRate,
      매출: metrics.actualRevenue,
      순이익: metrics.netProfit,
      ROAS: metrics.actualRoas,
      ROI: metrics.roi
    };
    setSavedScenarios([...savedScenarios, newScenario]);
  };

  // CSV 다운로드 (대체 옵션)
  const downloadCSV = () => {
    try {
      // CSV 데이터 생성
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // 현재 설정
      csvContent += "현재 설정\n";
      csvContent += "구분,CVR (%),CTR (%),예산,객단가,CPC,원가율 (%),매출,순이익,ROAS,ROI (%)\n";
      csvContent += `현재 설정,${cvr},${ctr},${budget},${aov},${cpc},${costRate},${Math.round(metrics.actualRevenue)},${Math.round(metrics.netProfit)},${metrics.actualRoas.toFixed(2)},${metrics.roi.toFixed(0)}\n\n`;
      
      // CVR 분석
      csvContent += "CVR별 손익분기점 분석\n";
      csvContent += "CVR (%),매출,순이익,ROAS,상태\n";
      const cvrData = generateCvrBreakevenData();
      cvrData.forEach(row => {
        csvContent += `${row.CVR},${Math.round(row.매출)},${Math.round(row.순이익)},${row.ROAS.toFixed(2)},${row.상태}\n`;
      });
      
      // 다운로드
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `광고분석_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV download error:', error);
      alert('CSV 다운로드 중 오류가 발생했습니다.');
    }
  };
  const downloadExcel = () => {
    try {
      if (!window.XLSX) {
        alert('엑셀 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();

      // 현재 설정 시트
      const currentData = [
        ['구분', 'CVR (%)', 'CTR (%)', '예산', '객단가', 'CPC', '원가율 (%)', '매출', '순이익', 'ROAS', 'ROI (%)'],
        ['현재 설정', cvr, ctr, budget, aov, cpc, costRate, Math.round(metrics.actualRevenue), Math.round(metrics.netProfit), metrics.actualRoas.toFixed(2), metrics.roi.toFixed(0)]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(currentData);
      XLSX.utils.book_append_sheet(wb, ws1, '현재설정');

      // 저장된 시나리오 시트
      if (savedScenarios.length > 0) {
        const scenarioData = [
          ['저장시간', 'CVR (%)', 'CTR (%)', '예산', '객단가', 'CPC', '원가율 (%)', '매출', '순이익', 'ROAS', 'ROI (%)'],
          ...savedScenarios.map(s => [
            s.저장시간, s.CVR, s.CTR, s.예산, s.객단가, s.CPC, s.원가율,
            Math.round(s.매출), Math.round(s.순이익), s.ROAS.toFixed(2), s.ROI.toFixed(0)
          ])
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(scenarioData);
        XLSX.utils.book_append_sheet(wb, ws2, '저장된시나리오');
      }

      // CVR 분석 시트
      const cvrData = generateCvrBreakevenData();
      const cvrSheetData = [
        ['CVR (%)', '매출', '순이익', 'ROAS', '상태'],
        ...cvrData.map(d => [d.CVR, Math.round(d.매출), Math.round(d.순이익), d.ROAS.toFixed(2), d.상태])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(cvrSheetData);
      XLSX.utils.book_append_sheet(wb, ws3, 'CVR분석');

      // CPC 분석 시트
      const cpcData = generateCpcBreakevenData();
      const cpcSheetData = [
        ['CPC', '클릭수', '전환수', '순이익', '상태'],
        ...cpcData.map(d => [d.CPC, d.클릭수, d.전환수, Math.round(d.순이익), d.상태])
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(cpcSheetData);
      XLSX.utils.book_append_sheet(wb, ws4, 'CPC분석');

      // 파일 다운로드
      const fileName = `광고분석_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 5).replace(/:/g, '')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Excel download error:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 테이블 행 스타일 함수
  const getRowStyle = (value, currentValue, isProfit = false) => {
    const values = generateCvrBreakevenData().map(d => d.CVR);
    const differences = values.map(v => ({ value: v, diff: Math.abs(v - currentValue) }));
    differences.sort((a, b) => a.diff - b.diff);
    const closestValues = [differences[0].value, differences[1]?.value].filter(Boolean);
    
    let bgColor = closestValues.includes(value) ? '#e0f2fe' : '';
    let textColor = isProfit ? (value >= 0 ? '#155724' : '#721c24') : '';
    
    return {
      backgroundColor: bgColor,
      color: textColor,
      fontWeight: isProfit ? 'bold' : 'normal'
    };
  };

  const getCpcRowStyle = (value, currentValue, isProfit = false) => {
    const values = generateCpcBreakevenData().map(d => d.CPC);
    const differences = values.map(v => ({ value: v, diff: Math.abs(v - currentValue) }));
    differences.sort((a, b) => a.diff - b.diff);
    const closestValues = [differences[0].value, differences[1]?.value].filter(Boolean);
    
    let bgColor = closestValues.includes(value) ? '#e0f2fe' : '';
    let textColor = isProfit ? (value >= 0 ? '#155724' : '#721c24') : '';
    
    return {
      backgroundColor: bgColor,
      color: textColor,
      fontWeight: isProfit ? 'bold' : 'normal'
    };
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">💰 광고 수익성 동적 대시보드</h1>

        {/* 다운로드 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-yellow-800">
            💡 <strong>다운로드 안내</strong>: 
            엑셀 다운로드가 작동하지 않으면 CSV 다운로드를 사용하세요. 
            CSV 파일은 엑셀에서 바로 열 수 있습니다.
          </div>
        </div>
        
        {/* 메인 스코어 카드 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-blue-800">
            💡 <strong>CTR-CPC 연동</strong>: CTR이 높을수록 품질점수가 올라가 CPC가 낮아집니다. 
            하나를 조정하면 다른 하나가 자동으로 변경됩니다.
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">실제 ROAS</p>
            <p className={`text-4xl font-bold ${metrics.actualRoas >= metrics.breakevenRoas ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.actualRoas.toFixed(2)}x
            </p>
            <p className="text-xs text-gray-500 mt-1">
              손익분기: {metrics.breakevenRoas.toFixed(2)}x
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">순이익</p>
            <p className={`text-4xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.netProfit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              이익률: {metrics.netMargin.toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">ROI</p>
            <p className={`text-4xl font-bold ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.roi.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              CPA: {formatCurrency(metrics.cpa)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">안전마진</p>
            <p className={`text-4xl font-bold ${metrics.safetyMargin >= 20 ? 'text-green-600' : metrics.safetyMargin >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {metrics.safetyMargin.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.safetyMargin >= 20 ? '안전' : metrics.safetyMargin >= 0 ? '주의' : '위험'}
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            onClick={saveScenario}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={16} />
            시나리오 저장
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            disabled={!window.XLSX}
            title={!window.XLSX ? "XLSX 라이브러리 로딩 중..." : "엑셀 파일로 다운로드"}
          >
            <Download size={16} />
            엑셀 다운로드
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Download size={16} />
            CSV 다운로드
          </button>
          {savedScenarios.length > 0 && (
            <button
              onClick={() => setSavedScenarios([])}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              기록 초기화
            </button>
          )}
        </div>

        {/* 입력 컨트롤 - 2열 배치 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 좌측 컨트롤 - 성과 지표 조정 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 성과 지표 조정</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">CVR (%)</label>
                  <span className="text-lg font-bold text-blue-600">{cvr}%</span>
                </div>
                <input
                  type="range"
                  value={cvr}
                  onChange={(e) => setCvr(parseFloat(e.target.value))}
                  className="w-full"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">CTR (%)</label>
                  <span className="text-lg font-bold text-blue-600">{ctr}%</span>
                </div>
                <input
                  type="range"
                  value={ctr}
                  onChange={(e) => handleCtrChange(parseFloat(e.target.value))}
                  className="w-full"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  CTR 변경 시 CPC 자동 조정
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">원가율 (%)</label>
                  <span className="text-lg font-bold text-blue-600">{costRate}%</span>
                </div>
                <input
                  type="range"
                  value={costRate}
                  onChange={(e) => setCostRate(parseInt(e.target.value))}
                  className="w-full"
                  min="10"
                  max="90"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* 우측 컨트롤 - 비용 지표 조정 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💵 비용 지표 조정</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">예산 (원)</label>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(budget)}</span>
                </div>
                <input
                  type="range"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value))}
                  className="w-full"
                  min="1000000"
                  max="20000000"
                  step="100000"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">객단가 (원)</label>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(aov)}</span>
                </div>
                <input
                  type="range"
                  value={aov}
                  onChange={(e) => setAov(parseInt(e.target.value))}
                  className="w-full"
                  min="10000"
                  max="1000000"
                  step="1000"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">CPC (원)</label>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(cpc)}</span>
                </div>
                <input
                  type="range"
                  value={cpc}
                  onChange={(e) => handleCpcChange(parseInt(e.target.value))}
                  className="w-full"
                  min="100"
                  max="5000"
                  step="10"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  CPC 변경 시 CTR 자동 조정
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 */}
        {metrics.netProfit < 0 ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">
                손실 발생! CVR을 높이거나 CPC를 낮추세요. (실제 ROAS: {metrics.actualRoas.toFixed(2)}x, 필요: {metrics.breakevenRoas.toFixed(2)}x)
              </p>
            </div>
          </div>
        ) : metrics.safetyMargin < 20 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-sm text-yellow-700">
                안전마진 부족! 시장 변동에 취약합니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-700">
                안전한 수익 구조입니다!
              </p>
            </div>
          </div>
        )}

        {/* 손익분기점 분석 테이블 - 2열 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* CVR별 손익분기점 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📈 CVR별 손익분기점 분석</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">CVR</th>
                    <th className="px-3 py-2 text-right">매출</th>
                    <th className="px-3 py-2 text-right">순이익</th>
                    <th className="px-3 py-2 text-right">ROAS</th>
                    <th className="px-3 py-2 text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {generateCvrBreakevenData().map((row, idx) => {
                    const rowStyle = getRowStyle(row.CVR, cvr);
                    return (
                      <tr key={idx} style={{ backgroundColor: rowStyle.backgroundColor }}>
                        <td className="px-3 py-2">{row.CVR}%</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(row.매출)}</td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: row.순이익 >= 0 ? '#155724' : '#721c24' }}>
                          {formatCurrency(row.순이익)}
                        </td>
                        <td className="px-3 py-2 text-right">{row.ROAS.toFixed(2)}x</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 text-xs rounded font-bold ${row.상태 === '흑자' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {row.상태}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CPC별 손익분기점 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💰 CPC별 손익분기점 분석</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">CPC</th>
                    <th className="px-3 py-2 text-right">클릭</th>
                    <th className="px-3 py-2 text-right">전환</th>
                    <th className="px-3 py-2 text-right">순이익</th>
                    <th className="px-3 py-2 text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {generateCpcBreakevenData().map((row, idx) => {
                    const rowStyle = getCpcRowStyle(row.CPC, cpc);
                    return (
                      <tr key={idx} style={{ backgroundColor: rowStyle.backgroundColor }}>
                        <td className="px-3 py-2">{formatCurrency(row.CPC)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(row.클릭수)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(row.전환수)}</td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: row.순이익 >= 0 ? '#155724' : '#721c24' }}>
                          {formatCurrency(row.순이익)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 text-xs rounded font-bold ${row.상태 === '흑자' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {row.상태}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 차트 섹션 - 2열 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 수익 구조 파이 차트 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💵 수익 구조</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: '매출원가', value: metrics.cogs, color: '#ef4444' },
                    { name: '광고비', value: budget, color: '#3b82f6' },
                    { name: '순이익', value: Math.max(0, metrics.netProfit), color: '#10b981' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { color: '#ef4444' },
                    { color: '#3b82f6' },
                    { color: '#10b981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 주요 지표 요약 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 상세 지표</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">필요 노출수</span>
                <span className="text-sm font-bold">{formatNumber(metrics.impressions)}회</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">필요 클릭수</span>
                <span className="text-sm font-bold">{formatNumber(metrics.clicks)}회</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">예상 전환수</span>
                <span className="text-sm font-bold">{formatNumber(metrics.conversions)}건</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">예상 매출</span>
                <span className="text-sm font-bold">{formatCurrency(metrics.actualRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">매출총이익률</span>
                <span className="text-sm font-bold">{metrics.grossMargin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">CPM</span>
                <span className="text-sm font-bold">{formatCurrency(metrics.cpm)}</span>
              </div>
              <div className="flex justify-between py-2 border-t pt-2">
                <span className="text-sm text-gray-600">CTR-CPC 효율</span>
                <span className="text-sm font-bold text-blue-600">
                  {((ctr / 1.5) * (1000 / cpc) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 저장된 시나리오 */}
        {savedScenarios.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📋 저장된 시나리오</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">저장시간</th>
                    <th className="px-3 py-2 text-center">CVR</th>
                    <th className="px-3 py-2 text-center">CTR</th>
                    <th className="px-3 py-2 text-right">예산</th>
                    <th className="px-3 py-2 text-right">객단가</th>
                    <th className="px-3 py-2 text-right">CPC</th>
                    <th className="px-3 py-2 text-center">원가율</th>
                    <th className="px-3 py-2 text-right">매출</th>
                    <th className="px-3 py-2 text-right">순이익</th>
                    <th className="px-3 py-2 text-center">ROAS</th>
                    <th className="px-3 py-2 text-center">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {savedScenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td className="px-3 py-2">{scenario.저장시간}</td>
                      <td className="px-3 py-2 text-center">{scenario.CVR}%</td>
                      <td className="px-3 py-2 text-center">{scenario.CTR}%</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(scenario.예산)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(scenario.객단가)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(scenario.CPC)}</td>
                      <td className="px-3 py-2 text-center">{scenario.원가율}%</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(scenario.매출)}</td>
                      <td className="px-3 py-2 text-right font-bold" style={{ color: scenario.순이익 >= 0 ? '#155724' : '#721c24' }}>
                        {formatCurrency(scenario.순이익)}
                      </td>
                      <td className="px-3 py-2 text-center">{scenario.ROAS.toFixed(2)}x</td>
                      <td className="px-3 py-2 text-center">{scenario.ROI.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitabilityDashboard;