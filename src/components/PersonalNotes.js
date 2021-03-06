import React, { Component } from 'react';
import { Grid, Loader, Dimmer, Table } from 'semantic-ui-react';
import { awsSigning } from '../utils';
import config from '../config';

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = {
  UserPoolId: config.cognito.userPoolId,
  ClientId: config.cognito.clientId
};

class PersonalNotes extends Component {
  state = {
    loadingData: false,
    loading: false,
    errorMessage: '',
    msg: '',
    loggedin: false,
    sessionPayload: '',
    notes: [],
  }

  async componentDidMount() {
    this.setState({ loadingData: true });
    document.title = "Oingo | Personal Notes";

    let session = '', loggedin = false;
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
      loggedin = true;
      cognitoUser.getSession((err, result) => {
        if (err) {
          alert(err);
          return;
        }
        session = result;
      });
    }

    if (loggedin) {
      let rdsRequest = {
        'retrieve': 'getPersonalNotes',
        'uID': session.idToken.payload.sub
      }

      let res = await awsSigning(rdsRequest, 'v1/oingordsaction');
      if (Array.isArray(res.data.body)) {
        this.setState({ notes: res.data.body });
      }
    }

    this.setState({ sessionPayload: session, loggedin, loadingData: false });
  }

  renderNotes() {
    let items;
    items = this.state.notes.map((note, id) => {
      return (
        <Table.Row key={id}>
          <Table.Cell>{note[1]}</Table.Cell>
          <Table.Cell>{note[0]}</Table.Cell>
          <Table.Cell>{note[3]}</Table.Cell>
          <Table.Cell>{note[2]}</Table.Cell>
        </Table.Row>
      );
    });

    return (
      <Table celled padded unstackable striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Tag</Table.HeaderCell>
            <Table.HeaderCell>Create On</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {items}
        </Table.Body>
      </Table>
    );
  }

  render() {
    if (this.state.loadingData) {
      return (
        <Dimmer active inverted>
          <Loader size='massive'>Loading...</Loader>
        </Dimmer>
      );
    }

    return (
      <div>
        <h2>Personal Notes</h2>
        {this.state.loggedin === false && <h3>Please Login!</h3>}

        {this.state.loggedin === true &&
          <Grid stackable>
            <Grid.Column>
              {this.state.notes.length > 0 && this.renderNotes()}
              {this.state.notes.length === 0 && <h3>No Personal Notes!</h3>}
            </Grid.Column>
          </Grid>
        }
      </div>
    );
  }
}

export default PersonalNotes;