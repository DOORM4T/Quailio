import { Stack, TextInput } from "grommet"
import { Close as CloseIcon } from "grommet-icons"
import React from "react"
import { CSSProperties } from "styled-components"
import ToolTipButton from "./ToolTipButton"

interface IProps {
  value: string
  placeholder?: string
  isSearching: boolean
  clearSearch: () => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>
  handleShortKeys?: (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => void | Promise<void>
  onClick?: (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ) => void | Promise<void>
  style?: CSSProperties
}
const SearchInput = React.forwardRef((props: IProps, ref) => {
  const {
    value,
    handleChange,
    handleShortKeys,
    onClick,
    style,
    isSearching,
    clearSearch,
  } = props

  return (
    <Stack anchor="right" style={{ width: "100%" }}>
      <TextInput
        value={value}
        placeholder="Search"
        onChange={handleChange}
        onKeyUp={handleShortKeys}
        onClick={onClick}
        style={{ fontSize: "12px", width: "100%", ...style }}
        ref={ref as any}
      />
      {isSearching && (
        <ToolTipButton
          tooltip="Clear search"
          icon={<CloseIcon color="status-critical" />}
          aria-label="Clear search"
          onClick={clearSearch}
          buttonStyle={ClearSearchButtonStyles}
        />
      )}
    </Stack>
  )
})

export default SearchInput

const ClearSearchButtonStyles = {
  background: "transparent",
  cursor: "pointer",
  border: "none",
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  marginRight: "1rem",
  padding: "1px 0 0 0",
}
