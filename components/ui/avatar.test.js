const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const AVATAR_SOURCE = fs.readFileSync(path.join(__dirname, "avatar.tsx"), "utf8");
const AVATAR_DEMO_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "website", "demos", "ui", "avatar-demo.tsx"),
	"utf8",
);
const AVATAR_DETAILS_SOURCE = readDetailCategorySource("ui");
const REGISTRY_SOURCE = readWebsiteRegistrySource();
const PRIMARY_AVATAR_PATH = path.join(
	__dirname,
	"..",
	"..",
	"public",
	"avatar-user",
	"venn",
	"venn.png",
);

function readPngDimensions(filePath) {
	const buffer = fs.readFileSync(filePath);
	assert.equal(buffer.toString("ascii", 1, 4), "PNG");
	assert.equal(buffer.toString("ascii", 12, 16), "IHDR");

	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
		bytes: buffer.byteLength,
	};
}

test("AvatarUnassigned exposes grey person and agent avatar states", () => {
	assert.match(AVATAR_SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent"/);
	assert.match(AVATAR_SOURCE, /import PersonIcon from "@atlaskit\/icon\/core\/person"/);
	assert.doesNotMatch(AVATAR_SOURCE, /@atlaskit\/icon\/core\/person-avatar/);
	assert.match(AVATAR_SOURCE, /type AvatarUnassignedKind = "person" \| "agent"/);
	assert.match(AVATAR_SOURCE, /function AvatarUnassigned\(/);
	assert.match(
		AVATAR_SOURCE,
		/"items-center justify-center text-icon-subtle after:border-border"/,
	);
	assert.match(AVATAR_SOURCE, /!isAgent && "bg-muted"/);
	assert.match(AVATAR_SOURCE, /shape=\{isAgent \? "hexagon" : "circle"\}/);
	assert.match(
		AVATAR_SOURCE,
		/render=\{\s*<IconComponent[\s\S]*color="currentColor"[\s\S]*label=""[\s\S]*size=\{avatarUnassignedIconSizeMap\[resolvedSize\]\}/,
	);
	assert.match(AVATAR_SOURCE, /AvatarUnassigned,/);
	assert.match(AVATAR_SOURCE, /type AvatarUnassignedProps,/);
});

test("hexagon avatars clip an inner frame so corner overlays render unclipped", () => {
	assert.match(AVATAR_SOURCE, /const HEXAGON_POINTS =/);
	assert.match(AVATAR_SOURCE, /hexagon: "after:border-0"/);
	assert.doesNotMatch(AVATAR_SOURCE, /hexagon: `\$\{HEXAGON_CLIP\} after:border-0`/);
	assert.match(AVATAR_SOURCE, /<span className=\{cn\("relative flex size-full items-center justify-center", HEXAGON_CLIP\)\}>/);
	assert.doesNotMatch(AVATAR_SOURCE, /isAgent && HEXAGON_CLIP/);
	assert.match(AVATAR_SOURCE, /isAgent && "size-full bg-muted"/);
	assert.match(AVATAR_SOURCE, /const AVATAR_OVERLAY_TYPES: ReadonlySet<unknown> = new Set\(\[/);
	assert.match(AVATAR_SOURCE, /function AvatarHexagonBorder\(\)/);
	assert.match(AVATAR_SOURCE, /text-border!/);
	assert.match(AVATAR_SOURCE, /<polygon[\s\S]*points=\{HEXAGON_POINTS\}[\s\S]*stroke="currentColor"/);
	assert.match(AVATAR_SOURCE, /<AvatarHexagonBorder \/>/);
});

test("avatar group overflow count uses 12px text and 14px text for large groups", () => {
	assert.match(AVATAR_SOURCE, /data-slot="avatar-group-count"/);
	assert.match(AVATAR_SOURCE, /rounded-full text-xs/);
	assert.match(AVATAR_SOURCE, /group-has-data-\[size=lg\]\/avatar-group:text-sm/);
	assert.doesNotMatch(AVATAR_SOURCE, /rounded-full text-sm/);
});

test("avatar group overflow icon scales down to 12px for small groups", () => {
	assert.match(AVATAR_SOURCE, /\[&_\[data-slot=icon\]\]:size-4/);
	assert.match(AVATAR_SOURCE, /\[&_svg\]:size-4/);
	assert.match(AVATAR_SOURCE, /group-has-data-\[size=sm\]\/avatar-group:\[&_\[data-slot=icon\]\]:size-3/);
	assert.match(AVATAR_SOURCE, /group-has-data-\[size=sm\]\/avatar-group:\[&_svg\]:size-3/);
});

test("avatar docs include only the base unassigned demo states", () => {
	assert.match(AVATAR_DEMO_SOURCE, /export function AvatarDemoUnassigned\(\)/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarUnassigned \/>/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarUnassigned kind="agent" \/>/);
	assert.doesNotMatch(AVATAR_DEMO_SOURCE, /<AvatarUnassigned kind="agent">\s*<AvatarPresenceIndicator/);
	assert.match(AVATAR_DETAILS_SOURCE, /demoSlug: "avatar-demo-unassigned"/);
	assert.match(REGISTRY_SOURCE, /"avatar-demo-unassigned"/);
	assert.match(REGISTRY_SOURCE, /default: mod\.AvatarDemoUnassigned/);
});

test("AvatarCompanyBadge exposes a size-aware company-logo dot for agent avatars", () => {
	assert.match(AVATAR_SOURCE, /function AvatarCompanyBadge\(/);
	assert.match(AVATAR_SOURCE, /data-slot="avatar-company-badge"/);
	assert.match(AVATAR_SOURCE, /"bg-primary text-primary-foreground ring-background/);
	assert.match(AVATAR_SOURCE, /group-data-\[size=2xl\]\/avatar:\[&_svg\]:size-4/);
	assert.match(AVATAR_SOURCE, /\tAvatarCompanyBadge,/);
	assert.match(AVATAR_SOURCE, /type AvatarCompanyBadgeProps,/);
	assert.match(AVATAR_DEMO_SOURCE, /export function AvatarDemoCompany\(\)/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarCompanyBadge>/);
	assert.match(AVATAR_DETAILS_SOURCE, /demoSlug: "avatar-demo-company"/);
	assert.match(REGISTRY_SOURCE, /"avatar-demo-company"/);
	assert.match(REGISTRY_SOURCE, /default: mod\.AvatarDemoCompany/);
});

test("AvatarProjectBadge exposes a square project tile for team-created agents", () => {
	assert.match(AVATAR_SOURCE, /function AvatarProjectBadge\(/);
	assert.match(AVATAR_SOURCE, /data-slot="avatar-project-badge"/);
	assert.match(AVATAR_SOURCE, /rounded-xs ring-2 select-none \[&_img\]:size-full \[&_img\]:object-cover/);
	assert.match(AVATAR_SOURCE, /\tAvatarProjectBadge,/);
	assert.match(AVATAR_SOURCE, /type AvatarProjectBadgeProps,/);
	assert.match(AVATAR_DEMO_SOURCE, /export function AvatarDemoProject\(\)/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarProjectBadge>/);
	assert.match(AVATAR_DEMO_SOURCE, /\/avatar-project\/group\.svg/);
	assert.match(AVATAR_DETAILS_SOURCE, /demoSlug: "avatar-demo-project"/);
	assert.match(REGISTRY_SOURCE, /"avatar-demo-project"/);
	assert.match(REGISTRY_SOURCE, /default: mod\.AvatarDemoProject/);
});

test("primary avatar asset stays sized for rendered avatar slots", () => {
	const dimensions = readPngDimensions(PRIMARY_AVATAR_PATH);

	assert.equal(dimensions.width, 192);
	assert.equal(dimensions.height, 192);
	assert.ok(dimensions.bytes < 80_000);
	assert.match(AVATAR_SOURCE, /"2xl": "size-24"/);
});
