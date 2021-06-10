import { Box, BoxTypes, CheckBox, List, Text } from "grommet"
import React from "react"
import SearchInput from "./SearchInput"

interface IProps {
  defaultOptions: any[]
  idField: string // Field name for the ID of the option type
  nameField: string // Field name for the Name of the option type
  isCheckedFunction: (arg: any) => boolean // Function to check if an option should be checked or not
  toggleOption: (id: string, isChecked: boolean) => () => void // Function for creating a function to toggle the individual state of an option

  itemBgColorField?: string // Optional background color field for an item
  itemTextColorField?: string // Optional text color field for an item

  boxStyles?: BoxTypes
}

function SearchAndCheckMenu({
  defaultOptions,
  idField,
  nameField,
  isCheckedFunction: checkedCondition,
  toggleOption,
  itemBgColorField,
  itemTextColorField,
  boxStyles,
}: IProps) {
  // Search state
  const [search, setSearch] = React.useState<string>("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  }

  const clearSearch = () => setSearch("")

  return (
    <React.Fragment>
      <SearchInput
        value={search}
        handleChange={handleSearchChange}
        clearSearch={clearSearch}
        isSearching={search !== ""}
      />
      <Box overflow="auto" height="medium" width="medium" {...boxStyles}>
        <List
          id="add-relationship-buttons"
          primaryKey={nameField}
          data={defaultOptions
            .filter((opt) =>
              opt[nameField].toLowerCase().includes(search.toLowerCase()),
            )
            .sort((a, b) => a[nameField].localeCompare(b[nameField]))}
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
