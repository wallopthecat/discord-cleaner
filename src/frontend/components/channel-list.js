import React from 'react';
import CheckboxTree from 'react-checkbox-tree';
import { matchesState } from 'xstate';

import { ChannelType } from '../../constants.js';
import { AppContext } from './app-context.js';

class ChannelList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			channels: [],
			checked: [],
			expanded: ['dms', 'groups', 'guilds']
		};

		this.onCheck = this.onCheck.bind(this);
	}

	onCheck(checked) {
		const { socket } = this.context;

		socket.emit('select', checked);
		this.setState({ checked: checked });
	}

	componentDidMount() {
		const { socket } = this.context;

		socket.on('channel-list', this.setChannels.bind(this));
	}

	setChannels(data, checked) {
		let nodes = data.map(channel => {
			return {
				value: channel.id,
				label: channel.name,
				type: channel.type
			};
		});

		let channels = [];
		const dms = nodes.filter(channel => channel.type === ChannelType.DM);
		const groups = nodes.filter(channel => channel.type === ChannelType.GROUP_DM);
		const guilds = nodes.filter(channel => channel.type === ChannelType.GUILD_TEXT);

		if (dms.length > 0) {
			channels.push({
				value: 'dms',
				label: 'Direct Messages',
				className: 'node-category',
				children: dms
			});
		}

		if (groups.length > 0) {
			channels.push({
				value: 'groups',
				label: 'Groups',
				className: 'node-category',
				children: groups
			});
		}

		if (guilds.length > 0) {
			channels.push({
				value: 'guilds',
				label: 'Servers',
				className: 'node-category',
				children: guilds
			});
		}

		this.setState({
			channels: channels,
			checked: checked
		});
	}

	filterNodes(keyword) {
		let expanded = [];
		let search = keyword.toLowerCase().trim();
		let nodesClone = JSON.parse(JSON.stringify(this.state.channels));

		let results = nodesClone.filter(function test(node) {
			if (node.label.toLowerCase().includes(search)) return true;

			if (node.children) {
				if ((node.children = node.children.filter(test)).length) {
					expanded.push(node.value);
					return true;
				}
			}
		});

		return { nodes: results, expanded: expanded };
	}

	render() {
		const { machineState } = this.context;
		const { filter } = this.props;

		let search = filter.toLowerCase().trim();
		let nodes = this.state.channels;
		let expanded = this.state.expanded;

		if (search) {
			let results = this.filterNodes(search);
			nodes = results.nodes;
			expanded = results.expanded;
		}

		return (
			<div className="channel-list no-select">
				<CheckboxTree
					nodes={nodes}
					expanded={expanded}
					checked={this.state.checked}
					onCheck={this.onCheck}
					disabled={!matchesState('ready', machineState)}
					onExpand={expanded => this.setState({ expanded })}
					showNodeIcon={false}
					icons={{
						check: <i className="discord-checkbox-checked" />,
						uncheck: <i className="discord-checkbox-unchecked" />,
						halfCheck: <i className="discord-checkbox-intermediate" />,
						expandClose: <i className="mdi mdi-24px mdi-chevron-right" />,
						expandOpen: <i className="mdi mdi-24px mdi-chevron-down" />
					}}
				/>
			</div>
		);
	}
}

ChannelList.contextType = AppContext;

export { ChannelList };
