import {
  BASE_URL,
  CONFIRM_DELETE_ACCOUNT_MESSAGE,
  TEST_EMAIL,
  TEST_PASSWORD,
} from "../fixtures/constants"

const FIRST_NETWORK_NAME = "First Test Network"
const SECOND_NETWORK_NAME = "Second Test Network"

const FIRST_PERSON_NAME = "Darth Vader"
const SECOND_PERSON_NAME = "Luke Skywalker"
const RELATIONSHIP = ["Father", "Son"]

describe("Setup", () => {
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
      .wait(10_000) // wait for the user doc to be created
  })
})

describe("Dashboard", () => {
  it("Creates a network and selects it", () => {
    cy.window()
      .then((win) => {
        /* Stub the output of "Create Network" prompt  */
        cy.stub(win, "prompt").returns(FIRST_NETWORK_NAME)
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
})

describe("People", () => {
  it("Adds a person", () => {
    cy.window()
      /* Stub the Add Person prompt to return the first test person name */
      .then((win) => cy.stub(win, "prompt").returns(FIRST_PERSON_NAME))
      /* Click the Add Person button, which prompts the user */
      .get("#add-person-button")
      .click()
      /* Wait for the person menu to display a person */
      .wait(2000)
      .get("#person-menu > li")
      .should("have.length", 1)
  })

  it("Adds a second person", () => {
    cy.window()
      /* Stub the Add Person prompt to return the first test person name */
      .then((win) => cy.stub(win, "prompt").returns(SECOND_PERSON_NAME))
      /* Click the Add Person button, which prompts the user */
      .get("#add-person-button")
      .click()
      /* Wait for the person menu to display a person */
      .wait(2000)
      .get("#person-menu > li")
      .should("have.length", 2)
  })

  it("Views a person's details panel", () => {
    cy.get(".view-person-button")
      /* Click the first view-person-button */
      .first()
      .click()
      /* Wait for the overlay to open */
      .wait(2000)
      /* Ensure the overlay is displayed */
      .get("#view-person-overlay")
      .should("exist")
  })

  it("Edits a person's content", () => {
    cy.get("#edit-button")
      .click()
      .get("#person-content-editor iframe")
      .first()
      .then((iframe) => {
        const body = cy.wrap(iframe.contents()).find("body")
        body.trigger("select").type(" This is new content").type("{ctrl}s")
      })
      .get(".content-editor-save-status")
      .first()
      .contains("Saved")
      .should("exist")
  })

  it("Adds a relationship for a person", () => {
    /* Stub prompts by returning relationship values */
    cy.window().then((win) => {
      let relationshipIndex = 0
      cy.stub(win, "prompt").callsFake(() => RELATIONSHIP[relationshipIndex++])
    })

    cy.log("Open the relationship creation dropdown")
      .get("#add-relationship-dropdown")
      .click()

    cy.log("Create a relationship to another person")
      .get("#add-relationship-buttons li")
      .first()
      /* This opens two consecutive prompts, which we've stubbed */
      .click()

    cy.log("Ensure the relationship was created")
      .get("#relationships-list li")
      .first()
      .contains(RELATIONSHIP[1])
      .should("exist")

    cy.log(
      "Ensure the relationship exists from the other person's point of view",
    )
      .get("#relationships-list .relationship-anchor")
      .first()
      .click()
      .wait(1000) /* wait for the person 2's info to appear in the overlay */
      .get("#relationships-list li")
      .first()
      .contains(RELATIONSHIP[0])
      .should("exist")
  })

  it("Deletes a relationship for a person", () => {
    cy.log("Delete the relationship from Person 2's point of view")
      .get("#edit-button")
      .click()
      .get("#relationships-list .delete-connection-button")
      .first()
      .click()
      .wait(1000) /* wait for the connection to be deleted*/

    cy.log("Ensure the relationship was deleted from Person 2's point of view")
      .get("#relationships-list li")
      /* the relationships list for Person 2 should now be empty */
      .should("not.exist")

    cy.log("Ensure the relationship was deleted from Person 1's point of view")
      /* Close the overlay */
      .get(".close-overlay-button")
      .first()
      .click()
      /* Click the first view-person-button */
      .get(".view-person-button")
      .first()
      .click()
      /* Wait for the overlay to open */
      .wait(2000)
      /* the relationships list for Person 1 should now be empty */
      .get("#relationships-list li")
      .should("not.exist")
  })

  it("Uploads a thumbnail", () => {
    cy.get("#thumbnail-upload-input")
      .attachFile("PLACEHOLDER_IMAGE.png")
      .wait(2000)
      .get("#change-thumbnail-button img")
      .should("exist")
  })
})

describe("Cleanup", () => {
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
