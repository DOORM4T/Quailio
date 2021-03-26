import { Box, CheckBox, List, Text, TextInput } from "grommet"
import React from "react"

interface IProps {
  search: string
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  defaultOptions: any[]
  idField: string // Field name for the ID of the option type
  nameField: string // Field name for the Name of the option type
  checkedField: string // Field name for a Boolean value in the option type to control its associated checkbox
  toggleConnection: (id: string, isConnected: boolean) => () => void // Function for creating a function to toggle the individual state of an option
}

function SearchAndCheckMenu({
  search,
  handleSearchChange,
  defaultOptions,
  idField,
  nameField,
  checkedField,
  toggleConnection,
}: IProps) {
  return (
    <React.Fragment>
      <TextInput
        placeholder="Search by name"
        value={search}
        onChange={handleSearchChange}
      />
      <List
        id="add-relationship-buttons"
        primaryKey="name"
        data={defaultOptions.filter((opt) =>
          opt.name.toLowerCase().includes(search.toLowerCase()),
        )}
        style={{ maxHeight: "350px", overflowY: "auto" }}
      >
        {/* Render the list items */}
        {(option: any) => (
          <Box
            direction="row"
            key={option[idField]}
            gap="small"
            width={{ min: "medium" }}
            onClick={toggleConnection(option[idField], option[checkedField])}
          >
            <Text>{option[nameField]}</Text>
            <Box direction="row" margin={{ left: "auto" }}>
              <CheckBox checked={option[checkedField]} />
            </Box>
          </Box>
        )}
      </List>
    </React.Fragment>
  )
}

export default SearchAndCheckMenu
