import { Box, CheckBox, List, Text, TextInput } from "grommet"
import React from "react"

interface IProps {
  defaultOptions: any[]
  idField: string // Field name for the ID of the option type
  nameField: string // Field name for the Name of the option type
  isCheckedFunction: (arg: any) => boolean // Function to check if an option should be checked or not
  toggleOption: (id: string, isChecked: boolean) => () => void // Function for creating a function to toggle the individual state of an option
  maxHeight?: string

  itemBgColorField?: string // Optional background color field for an item
  itemTextColorField?: string // Optional text color field for an item
  pad?: string // Optional item padding
}

function SearchAndCheckMenu({
  defaultOptions,
  idField,
  nameField,
  isCheckedFunction: checkedCondition,
  toggleOption,
  maxHeight = "small",
  itemBgColorField,
  itemTextColorField,
  pad,
}: IProps) {
  // Search state
  const [search, setSearch] = React.useState<string>("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  }

  return (
    <React.Fragment>
      <TextInput
        placeholder="Search by name"
        value={search}
        onChange={handleSearchChange}
      />
      <Box overflow="auto" height={{ max: "large" }}>
        <List
          id="add-relationship-buttons"
          primaryKey="name"
          data={defaultOptions.filter((opt) =>
            opt.name.toLowerCase().includes(search.toLowerCase()),
          )}
          style={{ maxHeight, overflowY: "auto" }}
        >
          {/* Render the list items */}
          {(option: any) => {
            const isChecked = checkedCondition(option)

            return (
              <Box
                key={option[idField]}
                direction="row"
                onClick={toggleOption(option[idField], isChecked)}
                gap="small"
                pad={pad}
                style={{
                  // Color (if the color field props are valid)
                  backgroundColor: itemBgColorField
                    ? option[itemBgColorField]
                    : undefined,
                  color: itemTextColorField
                    ? option[itemTextColorField]
                    : undefined,
                }}
                fill
              >
                <Text>{option[nameField]}</Text>
                <Box
                  direction="row"
                  margin={{ left: "auto" }}
                  style={{ backgroundColor: "#222" }}
                >
                  <CheckBox checked={isChecked} />
                </Box>
              </Box>
            )
          }}
        </List>
      </Box>
    </React.Fragment>
  )
}

export default SearchAndCheckMenu
