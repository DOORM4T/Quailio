import { Sidebar, Box, Heading, Button, Text, List } from "grommet"
import React from "react"

interface IProps {
  title: string
  details: string[]
}

// TODO: Change to modal
const Details: React.FC<IProps> = (props) => {
  return (
    <Sidebar
      align="stretch"
      direction="column"
      flex={false}
      gap="large"
      pad="small"
      header={140}
      footer={141}
    >
      <Box align="center" justify="start" direction="row">
        <Heading>{props.title}</Heading>
        <Box align="end" justify="center" flex>
          <Button label="Close" />
        </Box>
      </Box>
      <List data={props.details} />
      <Button label="Edit Information" />
      <Button label="Create Connection" />
    </Sidebar>
  )
}

export default Details
