/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import Container from '../../components/Container';
import { Loading, Owner, IssueList, ActionButton, PageActions } from './styles';

export default class Repository extends Component {
  // eslint-disable-next-line react/static-property-placement
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  // eslint-disable-next-line react/state-in-constructor
  state = {
    repository: {},
    issues: [],
    loading: true,
    issuesFilter: '',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'open',
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  filterIssues = async stateIssues => {
    const { match } = this.props;
    const { page, filterIssues } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: stateIssues,
        per_page: 5,
        page: filterIssues !== stateIssues ? 1 : page,
      },
    });

    if (stateIssues) {
      this.setState({
        filterIssues: stateIssues,
      });
    }

    if (filterIssues !== stateIssues) {
      this.setState({
        page: 1,
      });
    }

    this.setState({ issues: response.data });
  };

  handlePage = async action => {
    const { page, filterIssues } = this.state;
    await this.setState({
      page: action === 'back' ? page - 1 : page + 1,
    });
    this.filterIssues(filterIssues);
  };

  render() {
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <ActionButton>
          <span>Listar Issues por estado:</span>
          <button type="button" onClick={() => this.filterIssues('all')}>
            All
          </button>
          <button type="button" onClick={() => this.filterIssues('open')}>
            Open
          </button>
          <button type="button" onClick={() => this.filterIssues('closed')}>
            Closed
          </button>
        </ActionButton>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <PageActions>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePage('back')}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            type="button"
            disabled={issues.length < 5}
            onClick={() => this.handlePage('next')}
          >
            Próximo
          </button>
        </PageActions>
      </Container>
    );
  }
}
