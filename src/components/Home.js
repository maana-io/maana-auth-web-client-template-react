import { Link } from "react-router-dom";
import React from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

const GET_INFO = gql`
  query getInfo {
    info {
      id
      name
      description
    }
  }
`;

export function Home() {
  const { loading, error, data } = useQuery(GET_INFO);
  if (loading) return <p>Loading ...</p>;

  return (
    <div>
      <ul>
        <li>
          <Link to="/logout">Logout</Link>
        </li>
      </ul>
      <div>
        <h1>Congrats, you've been authenticated!</h1>
        <h2>{data.info.name}</h2>
      </div>
    </div>
  );
}
