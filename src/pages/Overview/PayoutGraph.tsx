// Copyright 2022 @rossbulat/polkadot-staking-experience authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import moment from 'moment';
import { Line, Bar } from 'react-chartjs-2';
import { APIContext } from '../../contexts/Api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_SUBSCAN_KEY, API_ENDPOINTS, SUBSCAN_ENABLED } from '../../constants';
import { planckToDot } from '../../Utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export class PayoutGraph extends React.Component<any, any> {

  static contextType = APIContext;

  state: any = {
    list: [],
  };

  componentDidMount () {
    this.fetchPayouts();
  }

  componentDidUpdate () {
    this.fetchPayouts();
  }

  // stop component refersh triggered by other API updates
  shouldComponentUpdate (nextProps: any, nextState: any) {
    let propsChanged = nextProps.account !== this.props.account;
    let stateChanged = this.state.list !== nextState.list;
    let update = propsChanged || stateChanged;
    return (update);
  }

  fetchPayouts = () => {

    if (!SUBSCAN_ENABLED) {
      return;
    }

    const { network } = this.context;

    fetch(network.subscanEndpoint + API_ENDPOINTS['subscanRewardSlash'], {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_SUBSCAN_KEY,
      },
      body: JSON.stringify({
        row: 21,
        page: 0,
        address: this.props.account,
      }),
      method: "POST"
    })
      .then(res => res.json())
      .then(res => {
        if (res.message === 'Success') {
          if (res.data.list !== null) {
            this.setState({
              list: res.data.list.reverse(),
            });
          } else {
            this.setState({
              list: [],
            });
          }
        }
      });
  }

  render () {

    const { network }: any = this.context;

    const options_line = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            drawBorder: false,
            color: 'rgba(255,255,255,0)',
            borderColor: 'rgba(255,255,255,0)',
          },
          ticks: {
            display: false,
            maxTicksLimit: 30,
            autoSkip: true,
          }
        },
        y: {
          ticks: {
            display: false,
            beginAtZero: false,
          },
          grid: {
            drawBorder: false,
            color: 'rgba(255,255,255,0)',
            borderColor: 'rgba(255,255,255,0)',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
          text: `${network.unit} Payouts`,
        },
        tooltip: {
          callbacks: {
            title: () => {
              return [];
            },
            label: (context: any) => {
              return `${context.parsed.y} ${context.label}`;
            },
          },
          intersect: false,
          interaction: {
            mode: 'nearest',
          },
          displayColors: false,
          backgroundColor: '#333',
        }
      },
    };

    const data_line = {
      labels: this.state.list.map((item: any, index: number) => {
        return '';
      }),
      datasets: [
        {
          label: 'Price',
          // data: empty_data,
          data: this.state.list.map((item: any, index: number) => {
            return planckToDot(item.amount);
          }),
          borderColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              return;
            }
            return getGradient(ctx, chartArea, true);
          },
          backgroundColor: '#d33079',
          pointStyle: undefined,
          pointRadius: 0,
          borderWidth: 2,
        }
      ],
    };

    const data_bar = {
      labels: this.state.list.map((item: any, index: number) => {
        return moment.unix(item.block_timestamp).format('Do MMM');
      }),
      datasets: [
        {
          label: 'Price',
          // data: empty_data,
          data: this.state.list.map((item: any, index: number) => {
            return planckToDot(item.amount);
          }),
          borderColor: '#d33079',
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              return;
            }
            return getGradient(ctx, chartArea, false);
          },
          pointRadius: 0,
          borderRadius: 5,
        },
      ],
    };

    const config_bar = {
      responsive: true,
      maintainAspectRatio: false,
      barPercentage: 0.37,
      scales: {
        x: {
          grid: {
            drawBorder: true,
            color: 'rgba(255,255,255,0)',
            borderColor: 'rgba(255,255,255,0)',
          },
          ticks: {
            font: {
              size: 10,
            },
            autoSkip: true,
          }
        },
        y: {
          ticks: {
            font: {
              size: 10,
            },
          },
          grid: {
            color: '#eee',
            borderColor: 'rgba(255,255,255,0)',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: () => {
              return [];
            },
            label: (context: any) => {
              return `${context.parsed.y} ${network.unit}`;
            },
          },
          displayColors: false,
        },
      },
    };

    let lastPayout: any = null;

    if (this.state.list.length > 0) {
      let _last = this.state.list.reverse()[0];
      lastPayout = {
        amount: planckToDot(_last['amount']),
        block_timestamp: _last['block_timestamp'] + "",
      };
    }

    let width: number, height: number, gradient: any;
    function getGradient (ctx: any, chartArea: any, inverse: boolean) {
      const chartWidth = chartArea.right - chartArea.left;
      const chartHeight = chartArea.bottom - chartArea.top;
      if (!gradient || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(inverse ? 1 : 0, 'rgba(203, 37, 111, 0.9)');
        gradient.addColorStop(inverse ? 0 : 1, 'rgba(223, 81, 144, 0.7)');
      }

      return gradient;
    }


    return (
      <>
        <h1>{lastPayout === null ? 0 : lastPayout.amount} DOT&nbsp;<span className='fiat'>{lastPayout === null ? `` : moment.unix(lastPayout['block_timestamp']).fromNow()}</span>
        </h1>
        <div className='graph' style={{ paddingLeft: '0.8rem', paddingRight: '0.8rem' }}>
          <div style={{ height: '185px' }}>
            <Bar options={config_bar} data={data_bar} />
          </div>
          <div className='graph_line' style={{
            height: '60px', backgroundColor: '#f1f1f1'
          }}>
            <Line options={options_line} data={data_line} />
          </div>
        </div>
      </>
    );
  }
}

export default PayoutGraph;