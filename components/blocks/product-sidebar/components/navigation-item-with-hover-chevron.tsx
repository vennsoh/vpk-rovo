"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { token } from "@/lib/tokens";
import { NavigationItemActions } from "./navigation-item-actions";
import { NavigationItemWithHoverChevronProps } from "./types";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

export function NavigationItemWithHoverChevron({
	icon: Icon,
	label,
	isExpanded = false,
	hasActions = false,
	onClick,
}: Readonly<NavigationItemWithHoverChevronProps>) {
	const [isHovered, setIsHovered] = useState(false);
	const [isFocusedWithin, setIsFocusedWithin] = useState(false);
	const isActionAreaVisible = isHovered || isFocusedWithin;

	const primaryControlStyle = {
		alignItems: "center",
		background: "transparent",
		border: 0,
		color: "inherit",
		cursor: "pointer",
		display: "flex",
		flex: 1,
		gap: token("space.025"),
		minWidth: 0,
		padding: 0,
		textAlign: "left",
	} satisfies CSSProperties;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				padding: token("space.050"),
				borderRadius: token("radius.xsmall"),
				backgroundColor: "transparent",
				position: "relative",
				gap: token("space.025"),
				minHeight: "32px",
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onFocusCapture={() => setIsFocusedWithin(true)}
			onBlurCapture={(event) => {
				const nextTarget = event.relatedTarget;
				if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
					setIsFocusedWithin(false);
				}
			}}
		>
			<button
				type="button"
				aria-expanded={isExpanded}
				onClick={onClick}
				style={primaryControlStyle}
			>
				{/* Icon - swaps to chevron while actions are available */}
				<span
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "24px",
						height: "24px",
						marginLeft: token("space.025"),
					}}
				>
					{isActionAreaVisible ? (
						isExpanded ? (
							<ChevronDownIcon label="" color={token("color.icon.subtle")} size="small" />
						) : (
							<ChevronRightIcon label="" color={token("color.icon.subtle")} size="small" />
						)
					) : (
						<Icon label="" color={token("color.icon.subtle")} />
					)}
				</span>

				{/* Label */}
				<span
					style={{
						font: token("font.body"),
						fontWeight: token("font.weight.medium"),
						color: token("color.text.subtle"),
						flex: 1,
						paddingLeft: token("space.025"),
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{label}
				</span>
			</button>

			{/* Right actions - shown on pointer hover or keyboard focus */}
			{hasActions && isActionAreaVisible ? <NavigationItemActions label={label} /> : null}
		</div>
	);
}
