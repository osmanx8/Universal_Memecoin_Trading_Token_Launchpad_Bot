import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TokenContext = createContext();

export function useTokens() {
  return useContext(TokenContext);
}

export function TokenProvider({ children }) {
  const [tokens, setTokens] = useState([]);
  const [activeTokenId, setActiveTokenId] = useState(null);

  // Load from backend on mount
  useEffect(() => {
    const authKey = localStorage.getItem('authKey');
    if (!authKey) {
      console.log('No authKey found in localStorage');
      return;
    }
    console.log('Loading tokens for authKey:', authKey);
    axios.get(`http://localhost:5000/api/mintedTokens?user=${authKey}`)
      .then(res => {
        console.log('Tokens loaded successfully:', res.data);
        // Flatten metadata fields for all tokens
        const flatTokens = res.data.map(token => ({
          ...token,
          ...(token.metadata || {})
        }));
        setTokens(flatTokens);
        if (flatTokens.length > 0) {
          setActiveTokenId(flatTokens[0]._id);
          console.log('Set active token ID:', flatTokens[0]._id);
        }
      })
      .catch((err) => {
        console.error('Failed to load tokens from database:', {
          error: err.message,
          response: err.response?.data,
          status: err.response?.status,
          authKey: authKey
        });
      });
  }, []);

  async function addToken(token, imageFile) {
    const authKey = localStorage.getItem('authKey');
    if (!authKey) {
      alert('Authentication error: No authKey found. Please log in again.');
      return;
    }
    try {
      // Use the imageUrl directly from the token data (already provided by prepare mint)
      const imageUrl = token.imageUrl;

      // Build the correct payload structure for the backend
      const payload = {
        authKey,
        deployerPrivateKey: token.deployerPrivateKey,
        deployerPublicKey: token.deployerPublicKey,
        buyerPrivateKey: token.buyerPrivateKey,
        buyerPublicKey: token.buyerPublicKey,
        tokenMintKey: token.tokenMintKey,
        tokenMintKeyPrivate: token.tokenMintKeyPrivate,
        metadataUri: token.metadataUri,
        metadata: {
          name: token.name,
          symbol: token.symbol,
          imageUrl: imageUrl
        }
      };
      console.log('Attempting to save token with payload:', payload);
      const res = await axios.post('http://localhost:5000/api/mintedTokens', payload);
      console.log('Token saved successfully:', res.data);
      const flatToken = {
        ...res.data.token,
        ...(res.data.token.metadata || {})
      };
      setTokens(prev => [{ ...flatToken, imageFile: imageFile }, ...prev]);
      setActiveTokenId(flatToken._id);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      const errorDetails = err.response?.data?.error || '';
      console.error('Failed to save token to database:', {
        errorMessage,
        errorDetails,
        payload: token,
        response: err.response?.data,
        status: err.response?.status
      });
      alert(`CRITICAL ERROR: FAILED TO SAVE TOKEN\n\nError: ${errorMessage}\nDetails: ${errorDetails}`);
    }
  }

  function setTokenLaunched(id) {
    setTokens(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: 'launched', 
      launchDate: Date.now(),
      launch: {
        ...t.launch,
        isLaunched: true,
        launchDate: Date.now()
      }
    } : t));
  }

  function setTokenMigrated(id) {
    setTokens(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: 'migrated', 
      migrated: true 
    } : t));
  }

  async function setTokenInfo(id, info) {
    const res = await axios.put(`http://localhost:5000/api/mintedTokens/${id}`, info);
    setTokens(prev => prev.map(t => t._id === id ? { ...t, ...res.data, imageFile: info.imageFile || t.imageFile } : t));
  }

  function updateTokenPnL(id, pnlData) {
    setTokens(prev => prev.map(t => t.id === id ? {
      ...t,
      pnl: {
        ...t.pnl,
        current: pnlData.current,
        history: [...t.pnl.history, {
          value: pnlData.current,
          timestamp: Date.now()
        }],
        lastUpdated: Date.now()
      }
    } : t));
  }

  function updateTokenFunding(id, fundingData) {
    setTokens(prev => prev.map(t => t.id === id ? {
      ...t,
      funding: {
        ...t.funding,
        totalFunded: fundingData.totalFunded,
        totalWithdrawn: fundingData.totalWithdrawn,
        history: [...t.funding.history, {
          type: fundingData.type, // 'fund' or 'withdraw'
          amount: fundingData.amount,
          timestamp: Date.now()
        }]
      }
    } : t));
  }

  function setActiveToken(id) {
    setActiveTokenId(id);
  }

  const activeToken = tokens.find(t => t._id === activeTokenId) || null;

  return (
    <TokenContext.Provider value={{ 
      tokens, 
      addToken, 
      setTokenLaunched, 
      setTokenMigrated, 
      setTokenInfo, 
      updateTokenPnL,
      updateTokenFunding,
      activeToken, 
      setActiveToken 
    }}>
      {children}
    </TokenContext.Provider>
  );
} 