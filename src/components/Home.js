import { Link } from "react-router-dom";
import React from "react";

export function Home() {
  return (
    <div>
      <ul>
        <li>
          <Link to="/logout">Logout</Link>
        </li>
      </ul>
      <div>
        <h1>Congrats, you've been authenticated!</h1>
      </div>
    </div>
  );
}
