import { Anchor, Box, List, Text } from "grommet"
import * as Icons from "grommet-icons"
import React, { Dispatch, FC, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import {
  disconnectPeople,
  setRelationshipShape,
} from "../../../store/networks/actions"
import {
  ConnectionShape,
  IPerson,
  IRelationships,
} from "../../../store/networks/networkTypes"
import {
  getCurrentNetworkId,
  getCurrentNetworkPeople,
} from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusData,
  getPersonInFocusRelationships,
} from "../../../store/selectors/ui/getPersonInFocusData"
import {
  setPathOverlayContent,
  setPersonInFocus,
} from "../../../store/ui/uiActions"
import Badge from "../../Badge"
import SearchInput from "../../SearchInput"
import ToolTipButton from "../../ToolTipButton"

// Specific data to display for a person related to the current person
interface IProps {
  isEditing: boolean
}

const Relationships: FC<IProps> = ({ isEditing }) => {
  //
  // #region Hooks
  //
  const dispatch: Dispatch<any> = useDispatch()

  /* We use memoized selectors here instead of current network or person props to...
      -prevent fields like unsaved person content from resetting when a relationship changes
      -prevent the connections & groups checklist menus from closing whenever one item is clicked (which is not fun) */
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPerson = useSelector(getPersonInFocusData)
  const relationships = useSelector(getPersonInFocusRelationships)
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)

  const [relPeople, setRelPeople] = useState<IPerson[]>([])
  const [search, setSearch] = useState("")

  // Update relatedPeopleData state every time the selected person changes
  useEffect(() => {
    if (!relationships) return

    const relatedPeople = getRelatedPeople(relationships, currentNetworkPeople)
    setRelPeople(relatedPeople)
  }, [relationships])

  //
  // #endregion Hooks
  //

  if (!currentNetworkId || !currentPerson) return null

  //
  // #region Relationships List
  //

  const renderListItem = (relPerson: IPerson, index: number) => {
    const relationship = currentPerson.relationships[relPerson.id]
    if (!relationship) return null

    const navigateToRelatedPerson = async () => {
      try {
        // Ask to continue if there are unsaved changes
        const doContinue = fireUnsavedChangeEvent()
        if (!doContinue) return

        // Navigate to the selected person's details
        await dispatch(setPersonInFocus(relPerson.id))
        setSearch("")
      } catch (error) {
        console.error(error)
      }
    }

    const isOneWay = relPerson.relationships[currentPerson.id].shape === "arrow"
    const RelationshipReasonText = (
      <Text
        size="medium"
        style={{
          fontStyle: "italic",
          wordWrap: "break-word",
          whiteSpace: "break-spaces",
        }}
      >
        {relationship.reason || "-"}
      </Text>
    )

    const destroyRelationship = async () => {
      const doContinue = window.confirm(
        `Destroy relationship with ${relPerson.name}?`,
      )
      if (!doContinue) return

      try {
        await dispatch(
          disconnectPeople(currentNetworkId, {
            p1Id: currentPerson.id,
            p2Id: relPerson.id,
          }),
        )
      } catch (error) {
        console.error(error)
      }
    }

    const openRelInPathsOverlay = () => {
      const relPath = [
        {
          id: currentPerson.id,
          description: "",
          name: currentPerson.name,
        },
        {
          id: relPerson.id,
          description: relationship.reason,
          name: relPerson.name,
        },
      ]

      dispatch(
        setPathOverlayContent({
          paths: [relPath],
          person1: currentPerson,
          person2: relPerson,
        }),
      )
    }

    const pickShape = (shape: ConnectionShape) => async () => {
      console.log(relationship.shape, shape)
      if (relationship.shape === shape) return

      try {
        await dispatch(
          setRelationshipShape(
            currentNetworkId,
            currentPerson.id,
            relPerson.id,
            shape,
          ),
        )
      } catch (error) {
        console.error(error)
      }
    }

    const shapeButtons = (
      <Box direction="column">
        <ToolTipButton
          onClick={openRelInPathsOverlay}
          icon={<Icons.Edit size="16px" color="neutral-3" />}
          tooltip="Edit"
          buttonStyle={{
            height: "16px",
          }}
        />
        <ToolTipButton
          onClick={destroyRelationship}
          icon={<Icons.Unlink size="16px" color="status-critical" />}
          tooltip="Destroy relationship"
          buttonStyle={{
            height: "16px",
          }}
        />
        {isOneWay ? (
          <ToolTipButton
            tooltip="This is a one-way relationship"
            icon={<Icons.LinkNext size="16px" color="status-disabled" />}
          />
        ) : (
          <ToolTipButton
            onClick={
              relationship.shape === "arrow"
                ? pickShape("none")
                : pickShape("arrow")
            }
            icon={
              relationship.shape === "arrow" ? (
                <Icons.CaretNext size="16px" color="status-ok" />
              ) : (
                <Icons.Clear size="16px" color="status-critical" />
              )
            }
            tooltip={
              relationship.shape === "arrow"
                ? "Click to make one-way relationship"
                : "Click to make two-way relationship"
            }
            buttonStyle={{ height: "16px" }}
          />
        )}
      </Box>
    )

    return (
      <Box
        key={`${relPerson.id}-${index}`}
        width="large"
        border={{ side: "bottom" }}
        direction="row"
      >
        {
          <Box
            direction="column"
            style={{
              width: "100%",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <Box direction="row">
              <Anchor
                className="relationship-anchor"
                onClick={navigateToRelatedPerson}
                label={relPerson.name}
                margin={{ right: "0.5rem" }}
              />

              {relPerson.isGroup && (
                <Badge
                  name="Group"
                  backgroundColor={relPerson.backgroundColor || "white"}
                  textColor={relPerson.textColor || "black"}
                />
              )}
            </Box>
            <Box pad="4px">{RelationshipReasonText}</Box>
          </Box>
        }
        {isEditing && shapeButtons}
      </Box>
    )
  }

  //
  // #endregion Relationships List
  //

  const filteredRelPeople = relPeople.filter((p) => {
    const doesMatchName = p.name.toLowerCase().includes(search.toLowerCase())
    const rel = p.relationships[currentPerson.id]
    const doesMatchDescription =
      rel &&
      rel.reason &&
      rel.reason.toLowerCase().includes(search.toLowerCase())
    return doesMatchName || doesMatchDescription
  })
  return (
    <Box
      direction="column"
      style={{ position: "relative" }}
      overflow={{ vertical: "auto" }}
    >
      <Box style={{ position: "sticky", top: 0 }}>
        <SearchInput
          value={search}
          isSearching={search !== ""}
          handleChange={(e) => setSearch(e.currentTarget.value)}
          clearSearch={() => setSearch("")}
          placeholder="Search connections"
          style={{ backgroundColor: "#333", borderRadius: "0 0 4px 4px" }}
        />
      </Box>
      <List
        id="relationships-list"
        data={filteredRelPeople}
        border={false}
        children={renderListItem}
        margin={{ top: "3rem" }}
      />
    </Box>
  )
}

function getRelatedPeople(
  personRelationships: IRelationships,
  currentNetworkPeople: IPerson[],
): IPerson[] {
  const relationshipIds = Object.keys(personRelationships)
  const relatedPeople = relationshipIds
    .map(relIdToRelPerson)
    .filter(nonNull) as IPerson[]

  return relatedPeople.sort(alphanumericSort)

  //
  // #region getRelatedPeople: HELPERS
  //
  function relIdToRelPerson(relationshipId: string): IPerson | null {
    const otherPerson = currentNetworkPeople.find(
      (p) => p.id === relationshipId,
    )
    if (!otherPerson) return null
    return otherPerson
  }

  function nonNull(item: IPerson | null) {
    return item !== null
  }

  function alphanumericSort(p1: IPerson, p2: IPerson) {
    return p1.name.localeCompare(p2.name)
  }

  //
  //#endregion getRelatedPeople: HELPERS
  //
}

export default Relationships
