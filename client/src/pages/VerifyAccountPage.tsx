import { Anchor, Box, Button, Heading, Image } from "grommet"
import React from "react"
import Logo from "../assets/logo.png"
import AppHeader, { HEADER_HEIGHT } from "../components/containers/AppHeader"
import { auth } from "../firebase/services"

const VerifyAccountPage: React.FC = () => {
  const resendEmailVerification = () => {
    auth.currentUser!.sendEmailVerification()
    window.alert("Sent!")
  }

  return (
    <React.Fragment>
      <AppHeader
        title="Quailio"
        children={
          <span style={{ marginTop: "16px", color: "#00C781" }}>beta</span>
        }
      />
      {/* User is signed in but hasn't verified their email address */}
      <Box
        align="center"
        justify="center"
        height={`calc(100vh - ${HEADER_HEIGHT}px)`}
        background="dark-1"
      >
        <Image src={Logo} width="128px" />
        <Heading level={2} textAlign="center">
          Please verify your email address at {auth.currentUser!.email}
        </Heading>
        <Anchor color="accent-1" onClick={resendEmailVerification}>
          Resend email verification
        </Anchor>
        <Button
          label="Continue"
          color="brand"
          onClick={() => window.location.reload()}
          margin={{ top: "small" }}
        />
      </Box>
    </React.Fragment>
  )
}

export default VerifyAccountPage
