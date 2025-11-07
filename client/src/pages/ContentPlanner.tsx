import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Trash2, LayoutGrid, CalendarDays, Edit2 } from "lucide-react";
import { format } from "date-fns";

const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contentType: z.string().min(1, "Content type is required"),
  description: z.string().optional(),
  status: z.string().default("idea"),
  publishDate: z.string().optional(),
  tags: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  description: string | null;
  status: string;
  publishDate: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  idea: "bg-gray-500",
  draft: "bg-blue-500",
  in_review: "bg-yellow-500",
  scheduled: "bg-purple-500",
  published: "bg-green-500",
};

const statusLabels: Record<string, string> = {
  idea: "Idea",
  draft: "Draft",
  in_review: "In Review",
  scheduled: "Scheduled",
  published: "Published",
};

export default function ContentPlanner() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      contentType: "blog_post",
      description: "",
      status: "idea",
      publishDate: "",
      tags: "",
    },
  });

  const { data: items = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContentFormValues) => {
      const payload = {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate).toISOString() : undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };
      const res = await apiRequest("POST", "/api/content", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Content Created",
        description: "Your content item has been created successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Failed to create content item. Please try again.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContentFormValues }) => {
      const payload = {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate).toISOString() : undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };
      const res = await apiRequest("PATCH", `/api/content/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Content Updated",
        description: "Your content item has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update content item. Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/content/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Content Deleted",
        description: "The content item has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete content item. Please try again.",
      });
    },
  });

  const onSubmit = (data: ContentFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = async (item: ContentItem, newStatus: string) => {
    try {
      const res = await apiRequest("PATCH", `/api/content/${item.id}`, { status: newStatus });
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Status Updated",
        description: `Content moved to ${statusLabels[newStatus]}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update content status. Please try again.",
      });
    }
  };

  const openEditDialog = (item: ContentItem) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      contentType: item.contentType,
      description: item.description || "",
      status: item.status,
      publishDate: item.publishDate ? format(new Date(item.publishDate), "yyyy-MM-dd") : "",
      tags: item.tags ? item.tags.join(", ") : "",
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setDialogOpen(true);
  };

  const groupedByStatus = items.reduce((acc, item) => {
    const status = item.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const upcomingItems = items
    .filter((item) => item.publishDate && new Date(item.publishDate) >= new Date())
    .sort((a, b) => new Date(a.publishDate!).getTime() - new Date(b.publishDate!).getTime());

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-content-planner">
              Content Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan, organize, and schedule your content strategy
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-content">
                <Plus className="mr-2 h-4 w-4" />
                New Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Content" : "Create New Content"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update your content item details" : "Add a new content item to your calendar"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ultimate SEO Guide 2025" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-content-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blog_post">Blog Post</SelectItem>
                              <SelectItem value="social_media">Social Media</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="infographic">Infographic</SelectItem>
                              <SelectItem value="case_study">Case Study</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="idea">Idea</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description or notes about this content..."
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="publishDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publish Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-publish-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input placeholder="seo, marketing, guide (comma-separated)" {...field} data-testid="input-tags" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-submit">
                      {editingItem ? "Update" : "Create"} Content
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="board" className="space-y-4" data-testid="tabs-content-views">
          <TabsList>
            <TabsTrigger value="board" data-testid="tab-kanban">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {["idea", "draft", "in_review", "scheduled", "published"].map((status) => (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${statusColors[status]}`} />
                    <h3 className="font-semibold text-sm">{statusLabels[status]}</h3>
                    <Badge variant="outline" className="ml-auto">
                      {groupedByStatus[status]?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-2" data-testid={`column-${status}`}>
                    {groupedByStatus[status]?.map((item) => (
                      <Card key={item.id} className="hover-elevate" data-testid={`card-${item.id}`}>
                        <CardHeader className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium leading-tight">
                              {item.title}
                            </CardTitle>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEditDialog(item)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteMutation.mutate(item.id)}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Select
                              value={item.status}
                              onValueChange={(newStatus) => handleStatusChange(item, newStatus)}
                            >
                              <SelectTrigger className="h-7 text-xs" data-testid={`select-status-${item.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="idea">Idea</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="in_review">In Review</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {item.contentType.replace("_", " ")}
                              </Badge>
                              {item.publishDate && (
                                <p className="text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {format(new Date(item.publishDate), "MMM d, yyyy")}
                                </p>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {item.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{item.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                    {(!groupedByStatus[status] || groupedByStatus[status].length === 0) && (
                      <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Content
                </CardTitle>
                <CardDescription>
                  Content scheduled for publication in the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingItems.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                        data-testid={`upcoming-${item.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.contentType.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className={statusColors[item.status]}>
                              {statusLabels[item.status]}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(item.publishDate!), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            data-testid={`button-edit-upcoming-${item.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(item.id)}
                            data-testid={`button-delete-upcoming-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming content scheduled</p>
                    <p className="text-sm mt-1">Add publish dates to your content to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      items.reduce((acc, item) => {
                        acc[item.contentType] = (acc[item.contentType] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type.replace("_", " ")}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(groupedByStatus).map(([status, statusItems]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${statusColors[status]}`} />
                          <span className="text-sm">{statusLabels[status]}</span>
                        </div>
                        <Badge variant="secondary">{statusItems.length}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
