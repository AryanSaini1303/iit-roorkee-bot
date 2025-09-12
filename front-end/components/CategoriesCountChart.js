'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './CategoriesCountChart.module.css';

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#f97316', '#10b981'];

export default function CategoriesPieChart({ data }) {
//   console.log(data);
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer
        width="100%"
        height={300}
        style={{ outline: 'none' }}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="num"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={105}
            paddingAngle={0}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(255, 255, 255, 0.472)"
                strokeWidth={2}
                style={{
                //   filter: `drop-shadow(0px 0px 1px ${
                //     COLORS[index % COLORS.length]
                //   }`,
                  outline: 'none',
                }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} queries`, name]}
            contentStyle={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '10px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
