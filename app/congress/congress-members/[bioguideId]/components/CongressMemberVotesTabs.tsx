"use client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CongressMemberVotePiechart from "./VotePolicyAreasPieChart";
import type { VoteStats, VotesByPolicyArea } from "@/lib/services/congress_two";
import VoteListView from "./VotesListView";

interface CongressMemberVoteTabsProps {
  stats: VoteStats;
  votesByPolicyArea: VotesByPolicyArea;
}

export function CongressMemberVoteTabs({
  stats,
  votesByPolicyArea,
}: CongressMemberVoteTabsProps) {
  return (
    <Card className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="yea">Yea</TabsTrigger>
          <TabsTrigger value="nay">Nay</TabsTrigger>
          <TabsTrigger value="didnt-vote">Didn't Vote</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <CongressMemberVotePiechart
                policyAreaVotes={votesByPolicyArea.all}
                title="Top Policy Areas (All Votes)"
                description={`Total Votes: ${stats.totalVotes}`}
                voteType="all"
              />
            </TabsContent>
            <TabsContent value="list">
              <VoteListView
                policyAreaVotes={votesByPolicyArea.all}
                title="All Votes by Policy Area"
                description={`Total Votes: ${stats.totalVotes}`}
                voteType="all"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="yea">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <CongressMemberVotePiechart
                policyAreaVotes={votesByPolicyArea.yea}
                title="Top Policy Areas (Yea Votes)"
                description={`Total Yea Votes: ${stats.totalYea}`}
                voteType="yea"
              />
            </TabsContent>
            <TabsContent value="list">
              {/* VoteListView component will go here */}
              <VoteListView
                policyAreaVotes={votesByPolicyArea.yea}
                title="Yea Votes by Policy Area"
                description={`Total Yea Votes: ${stats.totalYea}`}
                voteType="yea"
              />{" "}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="nay">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <CongressMemberVotePiechart
                policyAreaVotes={votesByPolicyArea.nay}
                title="Top Policy Areas (Nay Votes)"
                description={`Total Nay Votes: ${stats.totalNay}`}
                voteType="nay"
              />
            </TabsContent>
            <TabsContent value="list">
              {/* VoteListView component will go here */}
              <VoteListView
                policyAreaVotes={votesByPolicyArea.nay}
                title="Nay Votes by Policy Area"
                description={`Total Nay Votes: ${stats.totalNay}`}
                voteType="nay"
              />{" "}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="didnt-vote">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <CongressMemberVotePiechart
                policyAreaVotes={votesByPolicyArea.notVoting}
                title="Top Policy Areas (Not Voting)"
                description={`Total Not Voting: ${stats.totalNotVoting}`}
                voteType="notVoting"
              />
            </TabsContent>
            <TabsContent value="list">
              {/* VoteListView component will go here */}
              <VoteListView
                policyAreaVotes={votesByPolicyArea.nay}
                title="Nay Votes by Policy Area"
                description={`Total Nay Votes: ${stats.totalNay}`}
                voteType="nay"
              />{" "}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
