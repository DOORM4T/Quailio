import React from "react"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Form,
  FormExtendedEvent,
  FormField,
  Heading,
  TextInput,
  Text,
} from "grommet"
import * as Icons from "grommet-icons"

import Header from "../components/Header"
import { Link, useHistory } from "react-router-dom"
import { IAuthLoginAction, IAuthState } from "../store/auth/authTypes"
import { useDispatch } from "react-redux"
import { ThunkDispatch } from "redux-thunk"
import { login } from "../store/auth/authActions"
import { auth } from "../firebase"

const LoginPage: React.FC<IProps> = (props: IProps) => {
  const [values, setValues] = React.useState<IForm>(defaultFormValue)
  const [errorMessage, setMessage] = React.useState<string>("")
  const dispatch: LoginDispatch = useDispatch()
  const history = useHistory()

  React.useEffect(() => {
    /* redirect to dashboard if the user is already signed in */
    if (auth.currentUser) history.push("/dashboard")
  }, [])

  const handleSubmit = async (e: FormExtendedEvent<unknown, Element>) => {
    e.preventDefault()

    const submitted = e.value as IForm

    try {
      const action = login(submitted.email, submitted.password)
      await dispatch(action)
      history.push("/dashboard")
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <React.Fragment>
      <Header title="Log in" />
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
              Log in
            </Heading>
          </CardHeader>
          <CardBody pad={{ horizontal: "large" }}>
            <Form
              value={values}
              onChange={(nextValue) => setValues(nextValue as IForm)}
              onReset={() => setValues(defaultFormValue)}
              onSubmit={handleSubmit}
              validate="blur"
            >
              <FormField name="email" label="Email">
                <TextInput name="email" type="email" />
              </FormField>
              <FormField name="password" label="Password">
                <TextInput name="password" type="password" />
              </FormField>
              <Box direction="column" gap="medium" pad={{ bottom: "large" }}>
                {errorMessage && (
                  <Box>
                    <Text color="status-error" size="xsmall">
                      {errorMessage}
                    </Text>
                  </Box>
                )}
                <Button type="submit" label="Log in" />
              </Box>
            </Form>
          </CardBody>
          <CardFooter
            pad={{ horizontal: "medium", vertical: "small" }}
            background="light-2"
          >
            <Box margin={{ left: "auto" }}>
              <Link to="/register">Or... Register now!</Link>
            </Box>
          </CardFooter>
        </Card>
      </Box>
    </React.Fragment>
  )
}

export default LoginPage

interface IProps {}

type LoginDispatch = ThunkDispatch<IAuthState, null, IAuthLoginAction>

interface IForm {
  email: string
  password: string
}

const defaultFormValue: IForm = {
  email: "",
  password: "",
}
