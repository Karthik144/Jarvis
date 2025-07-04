"use client";

import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/system";
import { GlowOrb } from "../components/orb";
import { BoxStyles, ButtonStyles } from "./constants";
import SignupPopup from "../components/signup";
import Navbar from "../components/navbar";

export default function Home() {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSignup = (email: string, password: string) => {
    console.log("Signup attempt with:", { email, password });
  };

  return (
    <div>
      <Navbar />
      <Box sx={BoxStyles}>
        <GlowOrb size={150} color="rgba(100, 200, 255, 0.3)" top="15%" />

        {/* Main Heading */}
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 500, pt: 8 }}
        >
          Hey, I’m Jarvis{" "}
          <span role="img" aria-label="waving hand">
            👋
          </span>
        </Typography>

        {/* Subheading */}
        <Typography variant="h5" component="p" gutterBottom>
          I can optimize your DeFi yield for you.
        </Typography>

        {/* Secondary Text */}
        <Typography
          variant="body1"
          component="p"
          sx={{ fontStyle: "italic", color: "gray", marginBottom: 4 }}
        >
          No manual tweaking needed – just set it and forget it.
        </Typography>

        {/* Get Started Button */}
        <Button
          variant="contained"
          size="large"
          sx={ButtonStyles}
          onClick={handleClickOpen}
        >
          Get Started
        </Button>

        <SignupPopup
          open={open}
          onClose={handleClose}
          onSignup={handleSignup}
        />
      </Box>
    </div>
  );
}