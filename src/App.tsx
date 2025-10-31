import { useState } from "react";
import { Holdable, Sheet } from "components/functional";
import {
    Button,
    Caption,
    List,
    ListItem,
    Scrollable,
    Checkbox,
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

    const handleCheck = (id: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    return (
        <div className="app">
            <Scrollable scroll="y" h={240} gap={0}>
                <Caption level={1}>Title</Caption>

                <List px={6} py={10} gap={4}>
                    {items.map((item) => (
                        <Holdable
                            key={item.id}
                            render={(props) => (
                                <ListItem {...props}>
                                    <Checkbox
                                        defaultChecked={item.checked}
                                        onChange={() => handleCheck(item.id)}
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
                    ))}
                </List>
            </Scrollable>
            <Button onClick={() => setSheetOpen(true)}>Open Sheet</Button>

            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                defaultHeight={40}
            >
                <Caption level={2}>Sheet Modal</Caption>
                <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
                    This is a mobile bottom sheet component!
                    <br />
                    <br />
                    Try dragging the handle at the top:
                    <br />
                    • Drag up to expand to fullscreen
                    <br />
                    • Drag down to close the sheet
                    <br />
                    <br />
                    Everything is smoothly animated with native-like feel.
                </p>
                <div style={{ marginTop: "24px", display: "flex", gap: "8px" }}>
                    <Button
                        data-variant="accent"
                        onClick={() => setSheetOpen(false)}
                    >
                        Got it
                    </Button>
                    <Button onClick={() => setSheetOpen(false)}>Close</Button>
                </div>
            </Sheet>
        </div>
    );
}
