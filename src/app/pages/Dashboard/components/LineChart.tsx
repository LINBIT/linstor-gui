import React from 'react';
import { Chart, ChartAxis, ChartGroup, ChartLine, ChartVoronoiContainer } from '@patternfly/react-charts';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import './LineChart.css';

/**
 * Line chart for disk creation records of past week
 */

interface SimpleLineChartProps {
  data: { x: string; y: number }[];
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data }) => {
  const { t } = useTranslation('common');

  return (
    <div>
      <div className="chart__title">{t('disk_creation_records')}</div>
      <div className="chart__content">
        <Chart
          ariaDesc={t('disk_creation_records')}
          ariaTitle={t('disk_creation_records')}
          containerComponent={
            <ChartVoronoiContainer labels={({ datum }) => `${datum.name}: ${datum.y}`} constrainToVisibleArea />
          }
          height={250}
          maxDomain={{ y: 10 }}
          minDomain={{ y: 0 }}
          padding={{
            bottom: 40,
            left: 40,
            right: 40, // Adjusted to accommodate legend
            top: 20,
          }}
          width={900}
        >
          <ChartAxis tickValues={[2, 3, 4]} />
          <ChartAxis dependentAxis showGrid tickValues={[2, 5, 8]} />
          <ChartGroup>
            <ChartLine data={data.map((e) => ({ ...e, name: 'Records' }))} />
          </ChartGroup>
        </Chart>
      </div>
    </div>
  );
};

export default SimpleLineChart;
