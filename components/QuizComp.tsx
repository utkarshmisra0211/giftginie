"use client";

import { startChat } from "@/actions/serverActions";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function QuizComp() {
  const [response, setResponse] = useState("Nothing yet.");
  async function getResponse() {
    setResponse("Loading");
    const res = await startChat();
    setResponse(res);
  }
  return (
    <div>
      <Button onClick={getResponse}>Get Response</Button>
      <div>Response: {response}</div>
    </div>
  );
}
