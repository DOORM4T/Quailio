import { Box, Button, Heading, Sidebar, Text } from "grommet"
import React from "react"

interface IProps {}

const SideBar: React.FC<IProps> = (props) => {
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
        <Heading>Person's name</Heading>
        <Box align="end" justify="center" flex>
          <Button label="Close" />
        </Box>
      </Box>
      <Box align="start" justify="start" pad="small">
        <Text size="xlarge">Name (or category 1)</Text>
        <Text />
      </Box>
      <Box align="start" justify="start" pad="small">
        <Text size="xlarge">Birthday (or category 2)</Text>
        <Text />
      </Box>
      <Box align="start" justify="start" pad="small">
        <Text size="xlarge">Hometown (or category 3)</Text>
        <Text />
      </Box>
      <Box align="start" justify="start" pad="small">
        <Text size="xlarge">Last Edit</Text>
        <Text>1/9/21 or last edited date</Text>
      </Box>
      <Box align="center" justify="center" />
      <Button label="Edit Information" />
      <Button label="Create Connection" />
    </Sidebar>
  )
}

export default SideBar
