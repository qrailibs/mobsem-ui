import { Holdable } from "components/functional/holdable";
import { List, ListItem, Divider } from "components/semantical";

import "reset.css";
import "themes/default.css";

export default function App() {
    return (
        <div className="app">
            <h1>List</h1>

            <List px={6} py={10} gap={4}>
                <Holdable
                    menu={[
                        {
                            label: "Delete",
                            onSelect: () => console.log("Delete"),
                        },
                    ]}
                    render={(props) => (
                        <ListItem {...props}>
                            <p>Elton Jones</p>
                            <small>Author</small>
                        </ListItem>
                    )}
                />
                <Divider />
                <Holdable
                    render={(props) => (
                        <ListItem {...props}>
                            <p>Elton Jones</p>
                            <small>Author</small>
                        </ListItem>
                    )}
                />
            </List>
        </div>
    );
}
