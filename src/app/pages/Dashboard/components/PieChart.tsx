import React from 'react';
import { ChartPie, ChartThemeColor } from '@patternfly/react-charts';

import './PieChart.css';

interface PieChartProps {
  data?: Array<{ x: string; y: string | number }>;
  legendData?: Array<{ name: string }>;
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, legendData, title }) => (
  <div className="piechart__wrap">
    <div className="piechart__title">{title}</div>
    <div>
      <ChartPie
        ariaDesc=""
        ariaTitle=""
        constrainToVisibleArea={true}
        data={data}
        height={250}
        labels={({ datum }) => `${datum.x}: ${datum.y}`}
        legendData={legendData?.slice(0, 2)}
        legendPosition="bottom"
        padding={{
          bottom: 45,
          left: 10,
          right: 10,
          top: 20,
        }}
        width={300}
        innerRadius={80}
        themeColor={ChartThemeColor.orange}
      />
    </div>
  </div>
);

export default PieChart;
