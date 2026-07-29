import { useState } from "react";
import {
    Glass,
    Holdable,
    Sheet,
    Select,
    MultiSelect,
    FloatButton,
    FloatNav,
    ThemeProvider,
    ThemeMode,
    ThemeAccent,
    Image,
    Carousel,
} from "components/functional";
import {
    Button,
    Caption,
    Card,
    Container,
    Text,
    Divider,
    List,
    ListItem,
    Scrollable,
    Checkbox,
    Radio,
    TextInput,
    TextArea,
    SearchInput,
    Section,
    Label,
    Slider,
    Toggle,
    SegmentedTabs,
    VStack,
    HStack,
    ZStack,
    Spacer,
} from "components/semantical";

import "reset.css";
import "themes/default.css";

export default function App() {
    const [items, setItems] = useState([
        { id: 1, name: "Item 1", checked: false },
        { id: 2, name: "Item 2", checked: false },
        { id: 3, name: "Item 3", checked: false },
        { id: 4, name: "Item 4", checked: false },
        { id: 5, name: "Item 5", checked: false },
        { id: 6, name: "Item 6", checked: false },
        { id: 7, name: "Item 7", checked: false },
        { id: 8, name: "Item 8", checked: false },
        { id: 9, name: "Item 9", checked: false },
    ]);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [volume, setVolume] = useState(50);
    const [brightness, setBrightness] = useState(75);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [selectedView, setSelectedView] = useState("grid");
    const [activeTab, setActiveTab] = useState("input");
    const [subscribe, setSubscribe] = useState(false);
    const [country, setCountry] = useState<string>("");
    const [tags, setTags] = useState<string[]>(["design"]);
    const [priority, setPriority] = useState<string>("medium");
    const [plan, setPlan] = useState<string>("pro");
    const [taps, setTaps] = useState(0);
    const [navPage, setNavPage] = useState("home");
    const [mode, setMode] = useState<ThemeMode>("light");
    const [accent, setAccent] = useState<ThemeAccent>("cyan");

    const handleCheck = (id: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item,
            ),
        );
    };

    return (
        <ThemeProvider mode={mode} accent={accent}>
            <Container>
                <VStack className="app" spacing={16}>
                    <Caption level={1}>MobSem UI Components</Caption>

                    <HStack spacing={8}>
                        <SegmentedTabs
                            options={[
                                { value: "light", label: "Light" },
                                { value: "dark", label: "Dark" },
                            ]}
                            value={mode}
                            onChange={(v) => setMode(v as ThemeMode)}
                        />
                        <SegmentedTabs
                            options={[
                                { value: "cyan", label: "Cyan" },
                                { value: "blue", label: "Blue" },
                            ]}
                            value={accent}
                            onChange={(v) => setAccent(v as ThemeAccent)}
                        />
                    </HStack>

                    <SegmentedTabs
                        options={[
                            { value: "input", label: "Input" },
                            { value: "layout", label: "Layout" },
                            { value: "dialogs", label: "Dialogs" },
                            { value: "other", label: "Other" },
                        ]}
                        value={activeTab}
                        onChange={setActiveTab}
                    />

                    {activeTab === "input" && (
                        <List gap={12}>
                            <Section variant="outline" label="SearchInput">
                                <SearchInput placeholder="Search items..." />
                            </Section>

                            <Section variant="outline" label="TextInput">
                                <TextInput
                                    placeholder="Enter your name"
                                    autoComplete="name"
                                />
                            </Section>

                            <Section variant="outline" label="TextArea">
                                <TextArea placeholder="Tell us about yourself..." />
                            </Section>

                            <Section variant="outline" label="Select (flat)">
                                <Select
                                    placeholder="Choose priority"
                                    value={priority}
                                    onChange={setPriority}
                                    items={[
                                        {
                                            value: "low",
                                            title: "Low",
                                            description: "No rush, whenever",
                                            icon: "🟢",
                                        },
                                        {
                                            value: "medium",
                                            title: "Medium",
                                            description: "Sometime this week",
                                            icon: "🟡",
                                        },
                                        {
                                            value: "high",
                                            title: "High",
                                            description: "Needs attention soon",
                                            icon: "🟠",
                                        },
                                        {
                                            value: "urgent",
                                            title: "Urgent",
                                            description: "Drop everything",
                                            icon: "🔴",
                                        },
                                    ]}
                                />
                            </Section>

                            <Section variant="outline" label="Select (grouped, search)">
                                <Select
                                    search
                                    placeholder="Choose a country"
                                    value={country}
                                    onChange={setCountry}
                                    items={[
                                        {
                                            label: "Europe",
                                            items: [
                                                {
                                                    value: "de",
                                                    title: "Germany",
                                                    description: "Berlin",
                                                    icon: "🇩🇪",
                                                },
                                                {
                                                    value: "fr",
                                                    title: "France",
                                                    description: "Paris",
                                                    icon: "🇫🇷",
                                                },
                                                {
                                                    value: "es",
                                                    title: "Spain",
                                                    description: "Madrid",
                                                    icon: "🇪🇸",
                                                    disabled: true,
                                                },
                                            ],
                                        },
                                        {
                                            label: "Asia",
                                            items: [
                                                {
                                                    value: "jp",
                                                    title: "Japan",
                                                    description: "Tokyo",
                                                    icon: "🇯🇵",
                                                },
                                                {
                                                    value: "kr",
                                                    title: "South Korea",
                                                    description: "Seoul",
                                                    icon: "🇰🇷",
                                                },
                                            ],
                                        },
                                    ]}
                                />
                            </Section>

                            <Section
                                variant="outline"
                                label="MultiSelect (search, min 1 / max 3)"
                            >
                                <MultiSelect
                                    search
                                    min={1}
                                    max={3}
                                    placeholder="Choose tags"
                                    value={tags}
                                    onChange={setTags}
                                    items={[
                                        {
                                            value: "design",
                                            title: "Design",
                                            description: "UI, UX, research",
                                            icon: "🎨",
                                        },
                                        {
                                            value: "dev",
                                            title: "Development",
                                            description: "Code & review",
                                            icon: "💻",
                                        },
                                        {
                                            value: "marketing",
                                            title: "Marketing",
                                            description: "Growth & content",
                                            icon: "📣",
                                        },
                                        {
                                            value: "support",
                                            title: "Support",
                                            description: "Help desk",
                                            icon: "🛟",
                                        },
                                        {
                                            value: "legal",
                                            title: "Legal",
                                            description: "Contracts",
                                            icon: "⚖️",
                                            disabled: true,
                                        },
                                    ]}
                                />
                            </Section>

                            <Section variant="outline" label="Checkbox">
                                <HStack justify="between">
                                    <Text size="subheadline" weight="medium">
                                        Subscribe
                                    </Text>
                                    <Checkbox
                                        defaultChecked={subscribe}
                                        onChange={() => setSubscribe((s) => !s)}
                                    />
                                </HStack>
                            </Section>

                            <Section variant="outline" label="Radio">
                                <VStack spacing={8} align="start">
                                    {[
                                        { value: "free", label: "Free" },
                                        { value: "pro", label: "Pro" },
                                        { value: "team", label: "Team" },
                                    ].map((opt) => (
                                        // A native <label> makes the text a hit
                                        // target that selects the radio.
                                        <label
                                            key={opt.value}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <HStack spacing={8} align="center">
                                                <Radio
                                                    name="plan"
                                                    value={opt.value}
                                                    checked={plan === opt.value}
                                                    onChange={() =>
                                                        setPlan(opt.value)
                                                    }
                                                />
                                                <Text
                                                    size="subheadline"
                                                    weight="medium"
                                                >
                                                    {opt.label}
                                                </Text>
                                            </HStack>
                                        </label>
                                    ))}
                                </VStack>
                            </Section>

                            <Section variant="outline" label="Slider">
                                <VStack spacing={8}>
                                    <HStack justify="between">
                                        <Text
                                            size="subheadline"
                                            weight="medium"
                                        >
                                            Volume
                                        </Text>
                                        <Text size="subheadline" muted numeric>
                                            {volume}%
                                        </Text>
                                    </HStack>
                                    <Slider
                                        min={0}
                                        max={100}
                                        value={volume}
                                        onChange={(e) =>
                                            setVolume(parseInt(e.target.value))
                                        }
                                    />
                                </VStack>
                            </Section>

                            <Section variant="outline" label="Slider (Thick)">
                                <VStack spacing={8}>
                                    <HStack justify="between">
                                        <Text
                                            size="subheadline"
                                            weight="medium"
                                        >
                                            Brightness
                                        </Text>
                                        <Text size="subheadline" muted numeric>
                                            {brightness}%
                                        </Text>
                                    </HStack>
                                    <Slider
                                        min={0}
                                        max={100}
                                        value={brightness}
                                        onChange={(e) =>
                                            setBrightness(
                                                parseInt(e.target.value),
                                            )
                                        }
                                        variant="thick"
                                    />
                                </VStack>
                            </Section>

                            <Section variant="outline" label="Toggle">
                                <HStack justify="between">
                                    <Text size="subheadline" weight="medium">
                                        Notifications
                                    </Text>
                                    <Toggle
                                        checked={notificationsEnabled}
                                        onChange={(e) =>
                                            setNotificationsEnabled(
                                                e.target.checked,
                                            )
                                        }
                                    />
                                </HStack>
                            </Section>

                            <Section variant="outline" label="SegmentedTabs">
                                <SegmentedTabs
                                    options={[
                                        { value: "grid", label: "Grid" },
                                        { value: "list", label: "List" },
                                        { value: "compact", label: "Compact" },
                                    ]}
                                    value={selectedView}
                                    onChange={setSelectedView}
                                />
                            </Section>
                        </List>
                    )}

                    {activeTab === "layout" && (
                        <List gap={12}>
                            <Section variant="outline" label="Card">
                                <VStack spacing={8}>
                                    {(
                                        [
                                            "default",
                                            "outline",
                                            "ghost",
                                            "contrast",
                                            "accent",
                                            "accent-outline",
                                        ] as const
                                    ).map((v) => (
                                        <Card key={v} variant={v}>
                                            <Text weight="semibold">
                                                {v} card
                                            </Text>
                                            <Text size="subheadline">
                                                Some supporting content.
                                            </Text>
                                        </Card>
                                    ))}
                                </VStack>
                            </Section>

                            <Section
                                variant="outline"
                                label="Card (interactive)"
                            >
                                <VStack spacing={8}>
                                    <Card
                                        variant="accent"
                                        interactive
                                        onClick={() => setTaps((t) => t + 1)}
                                    >
                                        <HStack justify="between">
                                            <Text weight="semibold">
                                                Tap this card
                                            </Text>
                                            <Text
                                                weight="semibold"
                                                numeric
                                                animated
                                            >
                                                {taps}
                                            </Text>
                                        </HStack>
                                        <Text size="subheadline">
                                            Hover and press feedback, per
                                            variant.
                                        </Text>
                                    </Card>
                                    <Card variant="outline" interactive>
                                        <Text weight="semibold">
                                            Outline · interactive
                                        </Text>
                                    </Card>
                                </VStack>
                            </Section>

                            <Section variant="outline" label="HStack + Spacer">
                                <HStack spacing={8}>
                                    <Label variant="accent">Inbox</Label>
                                    <Text weight="medium">Messages</Text>
                                    <Spacer />
                                    <Label>12</Label>
                                </HStack>
                            </Section>

                            <Section variant="outline" label="VStack">
                                <VStack spacing={8} align="start">
                                    <Caption level={4}>Profile</Caption>
                                    <Text muted size="subheadline">
                                        A vertical stack lays children
                                        top-to-bottom.
                                    </Text>
                                    <HStack spacing={8}>
                                        <Button data-variant="accent">
                                            Follow
                                        </Button>
                                        <Button>Message</Button>
                                    </HStack>
                                </VStack>
                            </Section>

                            <Section variant="outline" label="ZStack">
                                <ZStack>
                                    <Section>
                                        <Text muted>Background layer</Text>
                                        <Text muted size="footnote">
                                            Sits underneath the overlay
                                        </Text>
                                    </Section>
                                    <Label variant="accent">On top</Label>
                                </ZStack>
                            </Section>
                        </List>
                    )}

                    {activeTab === "dialogs" && (
                        <>
                            <Scrollable scroll="y" h={240} gap={0}>
                                <Caption level={2}>Items List</Caption>

                                <List px={6} py={10} gap={4}>
                                    {items.length > 0 ? (
                                        items.map((item) => (
                                            <Holdable
                                                key={item.id}
                                                render={(props) => (
                                                    <ListItem {...props}>
                                                        <Checkbox
                                                            defaultChecked={
                                                                item.checked
                                                            }
                                                            onChange={() =>
                                                                handleCheck(
                                                                    item.id,
                                                                )
                                                            }
                                                        />
                                                        <hgroup>
                                                            <p>{item.name}</p>
                                                            <small>
                                                                Option
                                                            </small>
                                                        </hgroup>
                                                    </ListItem>
                                                )}
                                                menu={[
                                                    {
                                                        label: "Edit",
                                                        onHandle: () =>
                                                            console.log("Edit"),
                                                    },
                                                    {
                                                        label: "Delete",
                                                        variant: "destructive",
                                                        onHandle: () =>
                                                            console.log(
                                                                "Delete",
                                                            ),
                                                    },
                                                ]}
                                            />
                                        ))
                                    ) : (
                                        <VStack align="center">
                                            <Text muted>No items found</Text>
                                        </VStack>
                                    )}
                                </List>
                            </Scrollable>
                            <Button onClick={() => setSheetOpen(true)}>
                                Open Sheet
                            </Button>
                        </>
                    )}

                    {activeTab === "other" && (
                        <List gap={12}>
                            <Section variant="outline" label="Button">
                                <VStack spacing={8}>
                                    <HStack spacing={8}>
                                        <Button>Default</Button>
                                        <Button data-variant="accent">
                                            Accent
                                        </Button>
                                        <Button data-variant="outline">
                                            Outline
                                        </Button>
                                        <Button data-variant="ghost">
                                            Ghost
                                        </Button>
                                    </HStack>
                                    <HStack spacing={8}>
                                        <Button data-variant="success">
                                            Success
                                        </Button>
                                        <Button data-variant="warning">
                                            Warning
                                        </Button>
                                        <Button data-variant="danger">
                                            Danger
                                        </Button>
                                    </HStack>
                                </VStack>
                            </Section>

                            <Section variant="outline" label="Text">
                                <VStack spacing={4} align="start">
                                    <Text size="title">Title</Text>
                                    <Text size="headline">Headline</Text>
                                    <Text size="body">Body copy</Text>
                                    <Text size="footnote" muted>
                                        Footnote, muted
                                    </Text>
                                </VStack>
                            </Section>

                            <Section variant="outline" label="Caption">
                                <VStack spacing={4} align="start">
                                    <Caption level={1}>Heading 1</Caption>
                                    <Caption level={2}>Heading 2</Caption>
                                    <Caption level={3}>Heading 3</Caption>
                                </VStack>
                            </Section>

                            <Section
                                variant="outline"
                                label="Image (lazy + openable)"
                            >
                                <VStack spacing={8} align="start">
                                    <Image
                                        lazy
                                        openable
                                        src="/ocean.jpg"
                                        alt="Mountain river"
                                        style={{ width: "100%" }}
                                    />
                                    <Text size="footnote" muted>
                                        Tap to open · pinch or double-tap to
                                        zoom
                                    </Text>
                                </VStack>
                            </Section>

                            <Carousel gap={12}>
                                {[1, 2, 3, 4].map((id) => (
                                    <Carousel.Item key={id}>
                                        <Image
                                            lazy
                                            openable
                                            src="/ocean.jpg"
                                            alt={`Slide ${id}`}
                                            style={{ width: "100%" }}
                                        />
                                    </Carousel.Item>
                                ))}
                            </Carousel>

                            <Section variant="outline" label="Divider">
                                <VStack spacing={8}>
                                    <Text>Above</Text>
                                    <Divider />
                                    <Text>Below</Text>
                                </VStack>
                            </Section>

                            <Section variant="outline" label="Label">
                                <HStack spacing={8}>
                                    <Label>Default</Label>
                                    <Label variant="outline">Outline</Label>
                                    <Label variant="accent">Accent</Label>
                                    <Label variant="danger">Danger</Label>
                                    <Label variant="success">Success</Label>
                                    <Label variant="warning">Warning</Label>
                                </HStack>
                            </Section>

                            <Section variant="outline" label="Section">
                                <Section>
                                    <Text muted>Inner content area…</Text>
                                </Section>
                            </Section>
                        </List>
                    )}

                    <Sheet
                        open={sheetOpen}
                        onClose={() => setSheetOpen(false)}
                        defaultHeight={50}
                    >
                        <VStack spacing={16}>
                            <Caption level={2}>User Profile</Caption>

                            <Section>
                                <HStack spacing={8}>
                                    <Label variant="accent">Premium</Label>
                                    <Label variant="danger">
                                        2 notifications
                                    </Label>
                                </HStack>

                                <TextInput placeholder="Username" />
                                <TextInput
                                    placeholder="Email"
                                    type="email"
                                    defaultValue="user@example.com"
                                />
                                <TextArea placeholder="Bio" rows={3} />
                            </Section>

                            <HStack spacing={8}>
                                <Button
                                    data-variant="accent"
                                    onClick={() => setSheetOpen(false)}
                                >
                                    Save Changes
                                </Button>
                                <Button onClick={() => setSheetOpen(false)}>
                                    Cancel
                                </Button>
                            </HStack>
                        </VStack>
                    </Sheet>

                    {/* Clearance so content isn't hidden behind the fixed nav. */}
                    <div style={{ height: 96 }} />
                </VStack>

                <FloatButton variant="glass" onClick={() => setSheetOpen(true)}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
                </FloatButton>

                <FloatNav
                    variant="glass"
                    value={navPage}
                    onChange={setNavPage}
                    items={[
                        { value: "home", label: "Home", icon: "🏠" },
                        { value: "search", label: "Search", icon: "🔍" },
                        { value: "profile", label: "Profile", icon: "👤" },
                    ]}
                />
            </Container>
        </ThemeProvider>
    );
}
