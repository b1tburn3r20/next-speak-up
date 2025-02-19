"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Legislation } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, X, BookOpen, ArrowLeft } from "lucide-react";
import { parseKeyTerms } from "./utils";

interface AiBillKeyTermsProps {
  bill: Legislation;
}

export interface Term {
  term: string;
  definition: string;
}

const AiBillKeyTerms = ({ bill }: AiBillKeyTermsProps) => {
  if (!bill.key_terms) return null;

  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const dragStart = useRef({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Update window size on mount and resize
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateWindowSize();

    // Add event listener
    window.addEventListener("resize", updateWindowSize);

    // Cleanup
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  const terms = useMemo(() => {
    return parseKeyTerms(bill.key_terms);
  }, [bill.key_terms]);

  const filteredTerms = useMemo(() => {
    if (!searchTerm) return terms;
    const searchLower = searchTerm.toLowerCase();
    return terms.filter(
      (term) =>
        term.term.toLowerCase().includes(searchLower) ||
        term.definition.toLowerCase().includes(searchLower)
    );
  }, [terms, searchTerm]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case "Escape":
        if (selectedTerm) {
          setSelectedTerm(null);
          setSelectedIndex(-1);
          if (searchInputRef.current) searchInputRef.current.focus();
        } else {
          setIsVisible(false);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (filteredTerms.length > 0) {
          setSelectedIndex((prev) =>
            prev < filteredTerms.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        if (selectedIndex >= 0 && filteredTerms[selectedIndex]) {
          setSelectedTerm(filteredTerms[selectedIndex]);
        }
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && cardRef.current) {
      const cardWidth = cardRef.current.offsetWidth;
      const cardHeight = cardRef.current.offsetHeight;

      // Calculate new position
      let newX = e.clientX - dragStart.current.x;
      let newY = e.clientY - dragStart.current.y;

      // Apply boundaries
      newX = Math.max(0, Math.min(newX, windowSize.width - cardWidth));
      newY = Math.max(0, Math.min(newY, windowSize.height - cardHeight));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, selectedIndex, filteredTerms, selectedTerm]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  useEffect(() => {
    if (!isVisible) return;

    const handleMouseEvent = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "mouseup" && selectedTerm) {
          setSelectedTerm(null);
          setSelectedIndex(-1);
          if (searchInputRef.current) searchInputRef.current.focus();
        }
        return false;
      }
    };

    window.addEventListener("mousedown", handleMouseEvent, true);
    window.addEventListener("mouseup", handleMouseEvent, true);
    return () => {
      window.removeEventListener("mousedown", handleMouseEvent, true);
      window.removeEventListener("mouseup", handleMouseEvent, true);
    };
  }, [isVisible, selectedTerm]);

  const handleTermClick = (term: Term, index: number) => {
    setSelectedTerm(term);
    setSelectedIndex(index);
  };

  const handleBackClick = () => {
    setSelectedTerm(null);
    setSelectedIndex(-1);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  return (
    <>
      <Button
        ref={triggerRef}
        onClick={() => {
          setIsVisible(!isVisible);
          setSearchTerm("");
          setSelectedTerm(null);
          setSelectedIndex(-1);
        }}
        variant="ghost"
        size="icon"
        className="bg-accent hover:bg-accent/70"
      >
        <BookOpen className="h-5 w-5" />
      </Button>

      {isVisible && (
        <Card
          ref={cardRef}
          className="fixed shadow-lg z-50 rounded-3xl"
          style={{
            width: "400px",
            top: position.y,
            left: position.x,
            cursor: isDragging ? "grabbing" : "auto",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="p-4 border-b rounded-3xl bg-muted drag-handle cursor-grab flex justify-between items-center">
            <div className="flex items-center gap-2">
              {selectedTerm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 hover:bg-accent text-lg"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <>
                  <h3 className="font-semibold">Key Terms</h3>
                  <kbd className="text-xs bg-background px-2 py-1 rounded">
                    ESC
                  </kbd>
                </>
              )}
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-accent rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {!selectedTerm ? (
              <>
                <div className="relative mb-4">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredTerms.map((term, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          index === selectedIndex
                            ? "bg-accent"
                            : "bg-muted/50 hover:bg-accent/50"
                        }`}
                        onClick={() => handleTermClick(term, index)}
                      >
                        <h4 className="font-medium">{term.term}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {term.definition}
                        </p>
                      </div>
                    ))}

                    {filteredTerms.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No terms found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{selectedTerm.term}</h3>
                <p className="text-muted-foreground">
                  {selectedTerm.definition}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
};

export default AiBillKeyTerms;
