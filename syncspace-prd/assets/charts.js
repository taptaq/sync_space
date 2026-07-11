// Initialize Mermaid
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'neutral',
    securityLevel: 'loose',
    flowchart: { curve: 'basis', padding: 20 },
    sequence: { actorMargin: 50, boxMargin: 10 }
  });
}

(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var warm = style.getPropertyValue('--warm').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Weekly Sensory Load Trend ---
  var chartEl = document.getElementById('chart-trend');
  if (chartEl) {
    var chart = echarts.init(chartEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      grid: {
        top: 30,
        right: 20,
        bottom: 40,
        left: 50
      },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink, fontSize: 13 },
        formatter: function(params) {
          var p = params[0];
          return p.name + '<br/>感官负载: <b>' + p.value + '</b>';
        }
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 12 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 10,
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [{
        name: '感官负载',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [4.0, 5.5, 7.2, 6.0, 8.5, 3.0, 4.5],
        lineStyle: { color: accent, width: 2.5 },
        itemStyle: { color: accent, borderColor: bg2, borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent + '30' },
              { offset: 1, color: accent + '05' }
            ]
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: warm, type: 'dashed', width: 1.5 },
          label: {
            formatter: '临界点 7.0',
            color: warm,
            fontSize: 11,
            position: 'insideEndTop'
          },
          data: [{ yAxis: 7 }]
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 12,
          itemStyle: { color: '#C4715A', borderColor: bg2, borderWidth: 2 },
          label: {
            show: true,
            formatter: '崩溃',
            color: '#C4715A',
            fontSize: 11,
            position: 'top'
          },
          data: [
            { coord: ['周五', 8.5], value: '崩溃' }
          ]
        }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
})();
