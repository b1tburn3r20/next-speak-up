type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const Page = async ({ params }: PageProps) => {
  const { id } = await params;

  return (
    <div>
      <h1>Page ID: {id}</h1>
    </div>
  );
};

export default Page;
