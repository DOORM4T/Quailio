import {
  BASE_URL,
  CONFIRM_DELETE_ACCOUNT_MESSAGE,
  TEST_EMAIL,
  TEST_PASSWORD,
} from "../fixtures/constants"
const FIRST_NETWORK_NAME = "First Test Network"
const SECOND_NETWORK_NAME = "Second Test Network"

describe("Dashboard", () => {
  it("Sends a registered user to /dashboard", () => {
    cy.visit("/register")
      .get("#email-field")
      .type(TEST_EMAIL)
      .get("#password-field")
      .type(TEST_PASSWORD)
      .get("#confirm-password-field")
      .type(TEST_PASSWORD)
      .get("#register-button")
      .click()
      .url()
      /* Successful registration should send the user to the Dashboard route */
      .should("equal", `${BASE_URL}/dashboard`)
      .wait(5000) // wait for the user doc to be created
  })

  it("Creates a network and selects it", () => {
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        /* Stub the output of "Create Network" prompt  */
        cy.stub(win, "prompt").returns(FIRST_NETWORK_NAME)
      },
    })
      .get("#create-network-button")
      .click()
      .window()
      .its("prompt")
      .should("be.called")
      .wait(2000)
      .get("#select-network-dropbutton")
      .should("contain.text", FIRST_NETWORK_NAME)
  })

  it("Creates a second network and selects it", () => {
    cy.window()
      .then((win) => {
        /* Stub the output of "Create Network" prompt  */
        cy.stub(win, "prompt").returns(SECOND_NETWORK_NAME)
      })
      .get("#create-network-button")
      .click()
      .window()
      .its("prompt")
      .should("be.called")
      .wait(2000)
      .get("#select-network-dropbutton")
      .should("contain.text", SECOND_NETWORK_NAME)
  })

  it("Selects the first network from the drop list", () => {
    cy.window()
      .get("#select-network-dropbutton")
      .click()
      .get("#select-network-list > li")
      .then((items: unknown) => {
        const firstListItem = (items as HTMLLIElement[])[0]
        firstListItem.click()
      })
      /* The first test network should be selected */
      .get("#select-network-dropbutton")
      .should("contain.text", FIRST_NETWORK_NAME)
  })

  it("Deletes the user account", () => {
    cy.on("window:confirm", (str) => {
      expect(str).to.equal(CONFIRM_DELETE_ACCOUNT_MESSAGE)
      return true
    })

    cy.visit("/settings")
      .get("#manage-accordion")
      .click()
      .get("#delete-account-button")
      .click()
      .url()
      .should("equal", `${BASE_URL}/`)
  })
})

export {}
