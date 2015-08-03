{
  providers: [
    {
      prefilters: [
        {
          id: "auth",
          path: "module name",
          config: {
            consumers: {
              user: "password"
            }
          }
        },
        {
          id: "limit",
          path: "module name",
          config: {
            global: 100,
            consumers: {
              userA: 20,
              userB: 80
            }
          }
        }
      ],

      id: "id",
      context: "/provider",
      target: "http://server:port",

      resources: [
        context: "/resource1",

        prefilters: [
          {
            id: "auth",
            path: "module name",
            config: {
              consumers: {
                userA: "password"
              }
            }
          }
        ]
        
      ]
    }
  ]
}
