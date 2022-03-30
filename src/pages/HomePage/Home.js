import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "../../redux/blockchain/blockchainActions";
import { connectWallet } from "../../redux/blockchain/blockchainActions";
import { fetchData } from "./../../redux/data/dataActions";
import { StyledRoundButton } from "./../../components/styles/styledRoundButton.styled";
import * as s from "./../../styles/globalStyles";
import Navbar from "../../components/Navbar/Navbar";
import HeroSection from "../../components/HeroSection/HeroSection";
import Social from "../../components/SocialMedia/Social";
import Video from "../../components/Video/Video";

function Home() {
  let cost = 0;
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [mintDone, setMintDone] = useState(false);
  const [supply, setTotalSupply] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [displayCost, setDisplayCost] = useState(cost);
  const [state, setState] = useState(-1);
  const [canMintWL, setCanMintWL] = useState(false);
  const [disable, setDisable] = useState(false);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    let cost = 0;
    if (state == 1) {
      cost = CONFIG.WEI_COST_WL;
    } else {
      cost = CONFIG.WEI_COST_PU;
    }

    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}`);
    setClaimingNft(true);
    setDisable(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        setMintDone(true);
        setFeedback(`Complete , Welcome to the Twisted Family!`);
        setClaimingNft(false);
        blockchain.smartContract.methods
          .totalSupply()
          .call()
          .then((res) => {
            setTotalSupply(res);
          });

        dispatch(fetchData(blockchain.account));
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }

    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 2) {
      newMintAmount = 2;
    }
    setMintAmount(newMintAmount);
  };

  const maxNfts = () => {
    if (state == 1) {
      setMintAmount(CONFIG.MAX_LIMIT);
      setDisplayCost(
        parseFloat(CONFIG.DISPLAY_COST_WL * CONFIG.MAX_LIMIT).toFixed(3)
      );
    } else {
      setMintAmount(CONFIG.MAX_LIMIT);
      setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_PU * CONFIG.MAX_LIMIT).toFixed(3));
    }
  };

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
      const totalSupply = await blockchain.smartContract.methods
        .totalSupply()
        .call();
      setTotalSupply(totalSupply);
      let currentState = await blockchain.smartContract.methods
        .currentState()
        .call();
      console.log({ currentState });
      setState(currentState);

      if (currentState == 0) {
        setDisplayCost(0.00);
        setFeedback(`Minting is not Live yet"`);
        setDisable(true);
      } else if (currentState == 1) {
        let mintWL = await blockchain.smartContract.methods
          .isWhitelisted(blockchain.account)
          .call();
          console.log({ mintWL });
        setCanMintWL(mintWL);
        (mintWL) ? "" : setFeedback(`This wallet is not on the Whitelist`);
        (mintWL) ? setDisable(false) : setDisable(true);

        setDisplayCost(CONFIG.DISPLAY_COST_WL);
      } else {
        setDisplayCost(CONFIG.DISPLAY_COST_PU);
      }
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <>

      <s.Body>
        <Video />
        {/* <Navbar /> */}
        <s.FlexContainer
          jc={"space-evenly"}
          ai={"center"}
          fd={"row"}
          mt={"25vh"}
  
        >
          <s.TextTitle size={4.0} color={"#ffffff"} style={{ letterSpacing: "3px", padding: 20 }}>
              MINTING 3rd APRIL 2022<br />10AM EST
            </s.TextTitle>
        </s.FlexContainer>
        <s.SpacerLarge />
      </s.Body>

    </>
  );
}

export default Home;
