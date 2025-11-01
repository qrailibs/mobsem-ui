import { useState } from "react";
import { Holdable, Sheet } from "components/functional";
import {
    Button,
    Caption,
    List,
    ListItem,
    Scrollable,
    Checkbox,
    TextInput,
    TextArea,
    SearchInput,
    Section,
    Label,
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
    const [searchQuery, setSearchQuery] = useState("");
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");

    const handleCheck = (id: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="app">
            <Caption level={1}>MobSem UI Components</Caption>

            <List gap={8}>
                <SearchInput
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <TextInput
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <TextArea
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                />
            </List>

            <Scrollable
                scroll="y"
                h={240}
                gap={0}
                style={{ marginTop: "16px" }}
            >
                <Caption level={2}>Items List</Caption>

                <List px={6} py={10} gap={4}>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <Holdable
                                key={item.id}
                                render={(props) => (
                                    <ListItem {...props}>
                                        <Checkbox
                                            defaultChecked={item.checked}
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
                                        onHandle: () => console.log("Edit"),
                                    },
                                    {
                                        label: "Delete",
                                        variant: "destructive",
                                        onHandle: () => console.log("Delete"),
                                    },
                                ]}
                            />
                        ))
                    ) : (
                        <p style={{ textAlign: "center", opacity: 0.5 }}>
                            No items found
                        </p>
                    )}
                </List>
            </Scrollable>
            <Button onClick={() => setSheetOpen(true)}>Open Sheet</Button>

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

                    <TextInput placeholder="Username" defaultValue={name} />
                    <TextInput
                        placeholder="Email"
                        type="email"
                        defaultValue="user@example.com"
                    />
                    <TextArea placeholder="Bio" defaultValue={bio} rows={3} />
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
