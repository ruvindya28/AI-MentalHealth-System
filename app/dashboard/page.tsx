"use client"

import { Container } from "@/components/ui/container";
import { useState , useEffect } from "react";
import {motion} from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);
  return (
    <div className="min-h-screen bg-background p-8">
        <Container className="pt-20 pb-8 space-y-6">
        <div className="flex flex-col gap-2">
            <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-2"
            >
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
                {currentTime.toLocaleTimeString("en-US",{
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                })}
            </p>
                </motion.div>
        </div>

        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <Card className="border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
                
                <CardContent className="p-6 relative">
                    <div className="space-y-6">
                        <div className="flex item-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" /></div>
                            <div>
                                <h3 className="font-semibold text-lg">Quick Actions</h3>
                                <p className="text-sm text-muted-foreground">Start your wellness journey</p>
                            </div>

                        </div>
                            <div className="grid gap-3">
                                <Button 
                                variant="default"
                                className={cn(
                                "w-full justify-center p-6 h-auto group/button","bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90","transition-all duration-200 group-hover:translate-y-[-2px]")}
                                onClick={() => {}}>
                                    <div className="flex items-center gap-4 w-full">
    <MessageCircle className="w-6 h-6 text-white shrink-0" />

    <div className="flex flex-col items-start text-left">
      <h4 className="font-semibold text-lg text-white">
        Start Therapy
      </h4>

      <p className="text-sm text-white/80">
        Begin a new session
      </p>
    </div>
  </div>
                                
                                </Button>
                            </div>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
        </Container>
        </div>
  );
}