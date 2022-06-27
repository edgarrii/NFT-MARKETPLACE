import { useState, useEffect } from "react";

import { ethers } from "ethers";
import { Row, Col, Card, Button, Spinner } from "react-bootstrap";

const fromWei = (num) => ethers.utils.formatEther(num);

const Home = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadMarketplaceItems = async () => {
    const itemCount = await marketplace.nftCount();
    console.log(itemCount);
    let items = [];

    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.nfts(i);

      if (!item.isSold) {
        const uri = await nft.tokenURI(item.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketplace.getTotalPrice(item.nftId);

        items.push({
          totalPrice,
          itemId: item.nftId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
        });
      }
    }

    setLoading(false);
    setItems(items);
  };

  const buyMarketItem = async (item) => {
    console.log(item);
    await (
      await marketplace.purchaseNft(item.itemId, {
        value: item.totalPrice,
      })
    ).wait();

    loadMarketplaceItems();
  };

  useEffect(() => {
    loadMarketplaceItems();
  }, []);

  return (
    <>
      {loading ? (
        <main style={{ padding: "1rem 0" }}>
          <Spinner animation="border" style={{ display: "flex" }} />
        </main>
      ) : (
        <div className="flex justify-center">
          {items.length > 0 ? (
            <div className="px-5 container">
              <Row xs={1} md={2} lg={4} className="g-4 py-5">
                {items.map((item, idx) => (
                  <Col key={idx} className="overflow-hidden">
                    <Card>
                      <Card.Img variant="top" src={item.image} />
                      <Card.Body color="secondary">
                        <Card.Title>{item.name}</Card.Title>
                        <Card.Text>{item.description}</Card.Text>
                      </Card.Body>
                      <Card.Footer>
                        <div className="d-grid">
                          <Button
                            onClick={() => buyMarketItem(item)}
                            variant="primary"
                            size="lg"
                          >
                            Buy for {ethers.utils.formatEther(item.totalPrice)}{" "}
                            ETH
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <main style={{ padding: "1rem 0" }}>
              <h2>No listed NFTs</h2>
            </main>
          )}
        </div>
      )}
    </>
  );
};
export default Home;
