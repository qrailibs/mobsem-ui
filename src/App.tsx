import { useState } from "react";
import { Glass, Holdable, Sheet } from "components/functional";
import {
    Button,
    Caption,
    Divider,
    List,
    ListItem,
    Scrollable,
    Checkbox,
    TextInput,
    TextArea,
    SearchInput,
    Section,
    Label,
    Slider,
    Toggle,
    SegmentedTabs,
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
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [selectedView, setSelectedView] = useState("grid");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("input");
    const [subscribe, setSubscribe] = useState(false);

    const handleCheck = (id: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item,
            ),
        );
    };

    return (
        <div className="app">
            <Caption level={1}>MobSem UI Components</Caption>
            <div style={{ marginTop: "12px", marginBottom: "16px" }}>
                <SegmentedTabs
                    options={[
                        { value: "input", label: "Input" },
                        { value: "dialogs", label: "Dialogs" },
                        { value: "other", label: "Other" },
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {activeTab === "input" && (
                <>
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

                        <Section variant="outline" label="Checkbox">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Subscribe
                                </span>
                                <Checkbox
                                    defaultChecked={subscribe}
                                    onChange={() => setSubscribe((s) => !s)}
                                />
                            </div>
                        </Section>

                        <Section variant="outline" label="Slider">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Volume
                                </span>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        opacity: 0.6,
                                    }}
                                >
                                    {volume}%
                                </span>
                            </div>
                            <Slider
                                min={0}
                                max={100}
                                value={volume}
                                onChange={(e) =>
                                    setVolume(parseInt(e.target.value))
                                }
                            />
                        </Section>

                        <Section variant="outline" label="Slider (Thick)">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Brightness
                                </span>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        opacity: 0.6,
                                    }}
                                >
                                    {brightness}%
                                </span>
                            </div>
                            <Slider
                                min={0}
                                max={100}
                                value={brightness}
                                onChange={(e) =>
                                    setBrightness(parseInt(e.target.value))
                                }
                                variant="thick"
                            />
                        </Section>

                        <Section variant="outline" label="Toggle">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Notifications
                                </span>
                                <Toggle
                                    checked={notificationsEnabled}
                                    onChange={(e) =>
                                        setNotificationsEnabled(
                                            e.target.checked,
                                        )
                                    }
                                />
                            </div>
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
                </>
            )}

            {activeTab === "dialogs" && (
                <>
                    <Scrollable
                        scroll="y"
                        h={240}
                        gap={0}
                        style={{ marginTop: "16px" }}
                    >
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
                                                        handleCheck(item.id)
                                                    }
                                                />
                                                <hgroup>
                                                    <p>{item.name}</p>
                                                    <small>Option</small>
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
                                                    console.log("Delete"),
                                            },
                                        ]}
                                    />
                                ))
                            ) : (
                                <p
                                    style={{
                                        textAlign: "center",
                                        opacity: 0.5,
                                    }}
                                >
                                    No items found
                                </p>
                            )}
                        </List>
                    </Scrollable>
                    <Button onClick={() => setSheetOpen(true)}>
                        Open Sheet
                    </Button>
                </>
            )}

            {activeTab === "other" && (
                <List gap={12} style={{ marginTop: "16px" }}>
                    <Section variant="outline" label="Button">
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Button>Default</Button>
                            <Button data-variant="accent">Accent</Button>
                        </div>
                    </Section>

                    <Section variant="outline" label="Caption">
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                            }}
                        >
                            <Caption level={1}>Heading 1</Caption>
                            <Caption level={2}>Heading 2</Caption>
                            <Caption level={3}>Heading 3</Caption>
                        </div>
                    </Section>

                    <Section variant="outline" label="Divider">
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            <div>Above</div>
                            <Divider />
                            <div>Below</div>
                        </div>
                    </Section>

                    <Section variant="outline" label="Label">
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                            }}
                        >
                            <Label>Default</Label>
                            <Label variant="alert">Alert</Label>
                            <Label variant="tag">Tag</Label>
                        </div>
                    </Section>

                    <Section variant="outline" label="Section">
                        <Section>Inner content area...</Section>
                    </Section>
                </List>
            )}

            <Glass
                style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "8px 16px",
                    borderRadius: "100px",
                    zIndex: 100,
                }}
            >
                <p>Liquid Glass</p>
            </Glass>

            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                defaultHeight={50}
            >
                <Caption level={2}>User Profile</Caption>

                <Section style={{ marginTop: "16px" }}>
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                        }}
                    >
                        <Label variant="tag">Premium</Label>
                        <Label variant="alert">2 notifications</Label>
                    </div>

                    <TextInput placeholder="Username" />
                    <TextInput
                        placeholder="Email"
                        type="email"
                        defaultValue="user@example.com"
                    />
                    <TextArea placeholder="Bio" rows={3} />
                </Section>

                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                    <Button
                        data-variant="accent"
                        onClick={() => setSheetOpen(false)}
                    >
                        Save Changes
                    </Button>
                    <Button onClick={() => setSheetOpen(false)}>Cancel</Button>
                </div>
            </Sheet>
        </div>
    );
}
