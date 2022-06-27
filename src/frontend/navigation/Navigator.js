import React from "react";
import { Route, Routes } from "react-router-dom";

import Home from "../components/Home";
import Create from "../components/Create";
import MyListedItems from "../components/MyListedItems";
import MyPurchases from "../components/MyPurchases";

export default function Navigator({ marketplace, nft, account }) {
  return (
    <Routes>
      <Route path="/" element={<Home marketplace={marketplace} nft={nft} />} />
      <Route
        path="/create"
        element={<Create marketplace={marketplace} nft={nft} />}
      />
      <Route
        path="/my-nfts"
        element={
          <MyListedItems
            marketplace={marketplace}
            nft={nft}
            account={account}
          />
        }
      />
      <Route
        path="/my-purchases"
        element={
          <MyPurchases marketplace={marketplace} nft={nft} account={account} />
        }
      />
    </Routes>
  );
}
