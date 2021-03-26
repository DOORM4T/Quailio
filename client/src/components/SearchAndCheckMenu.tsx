import { Box, CheckBox, List, Text, TextInput } from "grommet"
import React from "react"

interface IProps {
  defaultOptions: any[]
  idField: string // Field name for the ID of the option type
  nameField: string // Field name for the Name of the option type
  isCheckedFunction: (arg: any) => boolean // Function to check if an option should be checked or not
  toggleOption: (id: string, isChecked: boolean) => () => void // Function for creating a function to toggle the individual state of an option
  maxHeight?: string
}

function SearchAndCheckMenu({
  defaultOptions,
  idField,
  nameField,
  isCheckedFunction: checkedCondition,
  toggleOption,
  maxHeight = "small",
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
      <Box overflow="auto" height={{ max: maxHeight }}>
        <List
          id="add-relationship-buttons"
          primaryKey="name"
          data={defaultOptions.filter((opt) =>
            opt.name.toLowerCase().includes(search.toLowerCase()),
          )}
          style={{ maxHeight: "350px", overflowY: "auto" }}
        >
          {/* Render the list items */}
          {(option: any) => {
            const isChecked = checkedCondition(option)

            return (
              <Box
                direction="row"
                key={option[idField]}
                gap="small"
                onClick={toggleOption(option[idField], isChecked)}
              >
                <Text>{option[nameField]}</Text>
                <Box direction="row" margin={{ left: "auto" }}>
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
