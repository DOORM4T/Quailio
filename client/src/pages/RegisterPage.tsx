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
  Text,
  TextInput,
} from "grommet"
import React from "react"
import { useDispatch } from "react-redux"
import { Link, useHistory } from "react-router-dom"
import { ActionCreator, AnyAction } from "redux"
import Header from "../components/Header"
import useAuthRedirect from "../hooks/auth/useAuthRedirect"
import { createAccount, setAuthLoading } from "../store/auth/authActions"

const RegisterPage: React.FC<IProps> = (props: IProps) => {
  /* redirect to dashboard if already authenticated */
  useAuthRedirect({ whenAuth: true, destination: "/dashboard" })

  const [values, setValues] = React.useState<IForm>(defaultFormValue)
  const [errorMessage, setMessage] = React.useState<string>("")
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const history = useHistory()

  const isValid = (formValues: IForm) => {
    setMessage("")

    if (!formValues.email.includes("@")) {
      setMessage("Invalid email.")
      return false
    }

    if (formValues.password.length < 6) {
      setMessage("Password is too short.")
      return false
    }

    if (formValues.password !== formValues.confirmPassword) {
      setMessage("Password and Confirm Password fields do not match.")
      return false
    }

    return true
  }

  const handleSubmit = async (e: FormExtendedEvent<unknown, Element>) => {
    e.preventDefault()

    const submitted = e.value as IForm
    const canSubmit = isValid(submitted)

    try {
      const registerAction = createAccount(submitted.email, submitted.password)
      if (canSubmit) {
        await dispatch(registerAction)
        history.push("/login")
      }
    } catch (error) {
      /* end loading state */
      dispatch(setAuthLoading(false))

      /* show error message upon failure */
      setMessage(error.message)
    }
  }

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
              <FormField name="confirmPassword" label="Confirm Password">
                <TextInput name="confirmPassword" type="password" />
              </FormField>

              <Box direction="column" gap="medium" pad={{ bottom: "large" }}>
                {errorMessage && (
                  <Box>
                    <Text color="status-error" size="xsmall">
                      {errorMessage}
                    </Text>
                  </Box>
                )}
                <Button type="submit" label="Register" />
              </Box>
            </Form>
          </CardBody>
          <CardFooter
            pad={{ horizontal: "medium", vertical: "small" }}
            background="light-2"
          >
            <Box margin={{ left: "auto" }}>
              <Link to="/login">Or... Log in!</Link>
            </Box>
          </CardFooter>
        </Card>
      </Box>
    </React.Fragment>
  )
}

export default RegisterPage

interface IProps {}

interface IForm {
  email: string
  password: string
  confirmPassword: string
}

const defaultFormValue: IForm = {
  email: "",
  password: "",
  confirmPassword: "",
}
