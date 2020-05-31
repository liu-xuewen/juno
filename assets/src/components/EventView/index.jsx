import { Component } from 'react';
import { Avatar, Icon, Tag } from 'antd';
import GitEventView from './git';
import DevopsEventView from './devops';
import ConfigEventView from './config';
import RegisterEventView from './register';
import TianoEventView from './tiano';
import styles from './style.css';
import CMDBEventView from '@/components/EventView/cmdb';

/**
 * 该组件负责处理事件信息的显示方式
 * @props data
 */
export default class EventView extends Component {
  render() {
    let { source, operation, metadata, user_name } = this.props.data;
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      return '---';
    }
    const { user_avatar } = metadata;
    let avatar;

    return <span>{this.renderEvent()}</span>;
  }

  renderEvent() {
    const { source } = this.props.data;
    switch (source) {
      case 'git':
        return <GitEventView data={this.props.data} />;
      case 'register':
        return <RegisterEventView data={this.props.data} />;
      case 'confgo':
        return <ConfigEventView data={this.props.data} />;
      case 'tiano':
        return <TianoEventView data={this.props.data} />;
      case 'devops':
        return <DevopsEventView data={this.props.data} />;
      case 'cmdb':
        return <CMDBEventView data={this.props.data} />;
    }
    return '--';
  }

  renderContent() {
    const { source, operation, metadata = '' } = r;
    //todo 根据source 和 operation 来动态展示详情内容

    //gitlab 推送
    if (source === 'git') {
      if (operation === 'git push') {
        try {
          const { ref, user_avatar, commits = [] } = JSON.parse(metadata);
          let commitInfo = {};
          if (commits.length > 0) {
            commitInfo = commits[0];
          }
          const { message, modified, added, removed } = commitInfo;
          return (
            <div>
              {user_avatar && (
                <Avatar
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                  }}
                  src={user_avatar}
                  alt={user_name}
                />
              )}
              {!user_avatar && (
                <Avatar
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                  }}
                  src={user_name[0]}
                  alt={user_name}
                />
              )}
              <span style={{ marginRight: '8px', marginLeft: '8px' }}>分支:{ref}</span>
              <span>提交信息:{message}</span>
            </div>
          );
        } catch (e) {
          console.log(e);
          return <div>-</div>;
        }
      } else if (operation === 'git pipeline') {
        //工作流
        const { object_attributes = {}, user = {}, commit = {} } = JSON.parse(metadata);
        const { sha, status, stages = [], created_at, finished_at, duration } = object_attributes;
        const { avatar_url } = user;
        const { message } = commit;
        return (
          <div>
            <Row>
              {avatar_url && <Avatar src={avatar_url} />}
              <span>提交信息:{message}</span>
            </Row>
            <Row>
              {status === 'success' && <Icon type="check" style={{ color: '#52c41a' }} />}
              {status === 'failed' && <Icon type="close" style={{ color: 'red' }} />}
              <span>
                工作流：
                {stages.map((v, i) => {
                  return (
                    <Tag key={i} color="#2db7f5">
                      {v}
                    </Tag>
                  );
                })}
              </span>
            </Row>
            <Row>
              <Col span={3}>耗时:{duration}s</Col>
              <Col span={6}>开始:{created_at}</Col>
              <Col span={6}>结束：{finished_at}</Col>
            </Row>
          </div>
        );
      }
    }

    //注册中心
    if (source === 'register') {
      const { key, value, host_name, ip, start_time, status } = JSON.parse(metadata);

      if (operation === 'up' || operation === 'down') {
        //注册操作
        let opMap = { up: '上线节点', down: '摘除节点' };
        return (
          <div>
            <span>
              {opMap[operation]}：{key}
            </span>
            <span style={{ marginLeft: '8px' }}>操作实例: {host_name}</span>
          </div>
        );
      }
      //进程操作
      const opMap = {
        start: '启动',
        stop: '停止',
        restart: '重启',
        status: '查看',
      };
      return (
        <div>
          <span>
            {opMap[operation]}: {host_name}
          </span>
        </div>
      );
    }

    //配置中心
    if (source === 'confgo') {
      const { config_name, instance_list = [], diff_keys } = JSON.parse(metadata);
      return (
        <div>
          <Row>
            <Col span={6}>
              <span>配置文件: {config_name}</span>
            </Col>

            <Col offset={1} span={6}>
              {' '}
              <Popover
                title="配置下发的实例机器列表"
                content={instance_list.map((v, i) => {
                  return <p key={i}>{v}</p>;
                })}
              >
                <Tag color={'#87d068'}>发布实例列表</Tag>
              </Popover>
            </Col>

            <Col offset={1} span={6}>
              {' '}
              <Popover
                title="配置内容变更详情"
                content={diff_keys.map((v, i) => {
                  const { key, op_type } = v;
                  let opMap = {
                    add: '新增',
                    update: '更改',
                    del: '删除',
                  };
                  return (
                    <p key={i}>
                      {opMap[op_type]}: {key}
                    </p>
                  );
                })}
              >
                <Tag color={'#2db7f5'}>配置变更详情</Tag>
              </Popover>
            </Col>
          </Row>
        </div>
      );
    }

    //发布中心
    if (source === 'tiano') {
      const {
        aid,
        commit_id,
        ip,
        host_name,
        pub_id,
        rollback,
        supervisor_param,
        gitlab_addr,
      } = JSON.parse(metadata);
      let isRoll = null;
      if (rollback === 'true') {
        isRoll = <Tag color={'red'}>回滚</Tag>;
      }
      let params = null;
      if (supervisor_param !== '') {
        params = (
          <Row style={{ marginTop: '4px' }}>
            <Col span={24}>supervisor启动参数:{supervisor_param}</Col>
          </Row>
        );
      }
      let commit = commit_id;
      if (gitlab_addr) {
        commit = (
          <a href={`${gitlab_addr}/commit/${commit_id}`} target={'_blank'}>
            {commit_id}
          </a>
        );
      }
      let pubFLow = null;
      if (aid) {
        pubFLow = (
          <a
            href={`http://tiano.xxxx.com/app/publishFormExec?id=${aid}&pubFlowTicketId=${pub_id}`}
            target={'_blank'}
          >
            {pub_id}
          </a>
        );
      }

      return (
        <div>
          <Row>
            <Col span={12}>发布实例：{host_name}</Col>
            <Col span={4}>发布版本:{commit}</Col>
            <Col span={4}>发布单:{pubFLow}</Col>
            <Col span={4}>{isRoll}</Col>
          </Row>
          <Row>{params}</Row>
        </div>
      );
    }

    return t;
  }
}
