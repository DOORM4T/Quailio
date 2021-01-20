import { Box, List, Menu as GrommetMenu, ResponsiveContext } from "grommet"
import * as Icons from "grommet-icons"
import React from "react"

const ActionList: React.FC<IProps> = (props) => {
  return (
    <List
      data={props.data}
      primaryKey="name"
      margin={{ bottom: "medium" }}
      style={{ overflowY: "auto" }}
      action={(item, index) => (
        <Menu
          key={`${item}-index`}
          index={index}
          item={item}
          handleView={props.handleView}
          handleEdit={props.handleEdit}
          handleDelete={props.handleDelete}
        />
      )}
      children={(item: IListItem, index: number) => (
        <Box dir="vertical" align="center">
          <Icons.User />
          {item.name}
        </Box>
      )}
    />
  )
}

const Menu: React.FC<IMenuProps> = (props) => {
  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "small" || size === "xsmall"
  const dropAlign: IDropAlign = isSmall ? { right: "left" } : { left: "right" }

  return (
    <GrommetMenu
      key={props.index}
      icon={<Icons.More />}
      dropAlign={dropAlign}
      items={[
        {
          label: <Icons.Catalog color="status-ok" aria-label="View details" />,
          onClick: props.handleView(props.item.id),
        },
        {
          label: <Icons.Edit color="neutral-3" aria-label="Edit" />,
          onClick: props.handleEdit(props.item.id),
        },
        {
          label: <Icons.Trash color="status-critical" aria-label="Delete" />,
          onClick: props.handleDelete(props.item.id),
        },
      ]}
    />
  )
}

export default ActionList

interface IProps {
  data: IListItem[]
  handleView: (name: string) => () => void
  handleEdit: (name: string) => () => void
  handleDelete: (name: string) => () => void
}

interface IListItem {
  name: string
  id: string
}

interface IMenuProps {
  index: number
  item: IListItem
  handleView: (name: string) => () => void
  handleEdit: (name: string) => () => void
  handleDelete: (name: string) => () => void
}

interface IDropAlign {
  top?: "top" | "bottom" | undefined
  bottom?: "top" | "bottom" | undefined
  left?: "left" | "right" | undefined
  right?: "left" | "right" | undefined
}
