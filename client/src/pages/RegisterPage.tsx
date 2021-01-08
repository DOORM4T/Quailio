import React from "react"
import {
  Anchor,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Form,
  FormField,
  Heading,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"

import Header from "../components/Header"
import { Link } from "react-router-dom"

interface IProps {}

const RegisterPage: React.FC<IProps> = (props: IProps) => {
  return (
    <React.Fragment>
      <Header title="Register" />
      <Box direction="column" align="center">
        <Card
          height="medium"
          width="medium"
          background="light-1"
          margin={{ top: "large" }}
          fill="vertical"
        >
          <CardHeader pad="medium" justify="center">
            <Heading level={2} textAlign="center">
              Register
            </Heading>
          </CardHeader>
          <CardBody pad={{ horizontal: "large" }}>
            <Form
            // value={value}
            // onChange={(nextValue) => setValue(nextValue)}
            // onReset={() => setValue({})}
            // onSubmit={({ value }) => {}}
            >
              <FormField name="email" label="Email" required>
                <TextInput name="email" type="email" />
              </FormField>

              <FormField name="password" label="Password" required>
                <TextInput name="password" type="password" />
              </FormField>
              <FormField
                name="confirm-password"
                label="Confirm Password"
                required
              >
                <TextInput name="confirm-password" type="password" />
              </FormField>

              <Box direction="row" gap="medium" pad={{ bottom: "large" }}>
                <Button type="submit" label="Register" />
              </Box>
            </Form>
          </CardBody>
          <CardFooter
            pad={{ horizontal: "medium", vertical: "small" }}
            background="light-2"
          >
            <Anchor margin={{ left: "auto" }}>
              <Link to="/login">Or... Log in!</Link>
            </Anchor>
          </CardFooter>
        </Card>
      </Box>
    </React.Fragment>
  )
}

export default RegisterPage
