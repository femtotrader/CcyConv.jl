var documenterSearchIndex = {"docs":
[{"location":"pages/manual/#Manual","page":"Manual","title":"Manual","text":"","category":"section"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Let's take a closer look at a few examples of how this package can be used in practice.","category":"page"},{"location":"pages/manual/#Basic-usage","page":"Manual","title":"Basic usage","text":"","category":"section"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"In the simplest case, you need to create a new FXGraph graph object:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"using CcyConv\n\n# Create a new graph\ncrypto = FXGraph()","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Then add information about currency pairs to it as Price objects:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"# Add exchange rates\npush!(crypto, Price(\"ADA\",  \"USDT\", 0.4037234))\npush!(crypto, Price(\"USDT\", \"BTC\",  0.0000237))\npush!(crypto, Price(\"BTC\",  \"ETH\",  18.808910))\npush!(crypto, Price(\"ETH\",  \"ALGO\", 14735.460))\n\n# Or use 'append!':\nappend!(\n    crypto,\n    [\n        Price(\"ADA\",  \"USDT\", 0.4037234),\n        Price(\"USDT\", \"BTC\",  0.0000237),\n        Price(\"BTC\",  \"ETH\",  18.808910),\n        Price(\"ETH\",  \"ALGO\", 14735.460),\n    ],\n);","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Finally, you can use one of the algorithms to find a path between required currency pairs:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"# Convert ADA to BTC\njulia> conv = conv_a_star(crypto, \"ADA\", \"BTC\");\n\njulia> conv_value(conv)\n0.000009582698067\n\njulia> conv_chain(conv)\n2-element Vector{CcyConv.AbstractPrice}:\n Price(\"ADA\",  \"USDT\", 0.4037234)\n Price(\"USDT\", \"BTC\",  0.0000237)","category":"page"},{"location":"pages/manual/#Custom-price","page":"Manual","title":"Custom price","text":"","category":"section"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"You can also define a new custom subtype of an abstract type AbstractPrice representing the price of a currency pair and, for example, having information about the exchange to which it belongs. In this case, there may be several edges between two currencies with different prices of the corresponding exchanges.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"using CcyConv\n\n# Create a new graph\ncrypto = FXGraph()\n\n# Custom Price\nstruct MyPrice <: CcyConv.AbstractPrice\n    exchange::String\n    from_asset::String\n    to_asset::String\n    price::Float64\nend","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"In this case, it is important to override the following getter methods for the new custom type MyPrice because they will be used during pathfinding:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"CcyConv.from_asset(x::MyPrice) = x.from_asset\nCcyConv.to_asset(x::MyPrice) = x.to_asset\nCcyConv.price(x::MyPrice) = x.price","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Now we can add objects of our new custom type to the graph and find the conversion path using the available algorithms:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"# Add exchange rates\npush!(crypto, MyPrice(\"Binance\", \"ADA\",  \"USDT\", 0.4037234))\npush!(crypto, MyPrice(\"Huobi\",   \"USDT\", \"BTC\",  0.0000237))\npush!(crypto, MyPrice(\"Okex\",    \"BTC\",  \"ETH\",  18.808910))\npush!(crypto, MyPrice(\"Gateio\",  \"ETH\",  \"ALGO\", 14735.460))","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"# Convert ADA to BTC\njulia> conv = conv_a_star(crypto, \"ADA\", \"BTC\");\n\njulia> conv_value(conv)\n0.000009582698067\n\njulia> conv_chain(conv)\n2-element Vector{CcyConv.AbstractPrice}:\n MyPrice(\"Binance\", \"ADA\",  \"USDT\", 0.4037234)\n MyPrice(\"Huobi\",   \"USDT\", \"BTC\",  0.0000237)","category":"page"},{"location":"pages/manual/#context_manual","page":"Manual","title":"Using context","text":"","category":"section"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Finally, we can go further and implement a context into our workspace. This will allow us to request and cache data from different sources without crossing them with each other.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"First, let's define a new context MyCtx that can store the previously requested data.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"using CcyConv\nusing CryptoExchangeAPIs.Binance\n\nstruct MyCtx <: CcyConv.AbstractCtx\n    prices::Dict{String,Float64}\n\n    MyCtx() = new(Dict{String,Float64}())\nend","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Also, now the currency pair ExSymbol will not store a specific price value, but instead will contain only the corresponding symbol required for the API request. This will be achieved by further overloading the price method.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"struct ExSymbol <: CcyConv.AbstractPrice\n    base_asset::String\n    quote_asset::String\n    symbol::String\nend","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"As before, new getter methods must be defined to conform to the AbstractPrice interface. Particular attention should be paid to the price method, which now first tries to find the desired price in the context cache MyCtx and only if this price has not been previously requested - makes a request to the exchange API.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"function CcyConv.from_asset(x::ExSymbol)::String\n    return x.base_asset\nend\n\nfunction CcyConv.to_asset(x::ExSymbol)::String\n    return x.quote_asset\nend\n\nfunction CcyConv.price(ctx::MyCtx, x::ExSymbol)::Float64\n    return get!(ctx.prices, x.symbol) do\n        try\n            Binance.Spot.avg_price(; symbol = x.symbol).result.price\n        catch\n            NaN\n        end\n    end\nend","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Finally, you need to create a new graph, a custom context and add custom currency pairs to the graph:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"my_graph = FXGraph()\nmy_ctx = MyCtx()\nmy_conv = (to, from) -> conv_value(my_graph(my_ctx, CcyConv.a_star_alg, to, from))\n\npush!(my_graph, ExSymbol(\"ADA\",  \"BTC\",  \"ADABTC\"))\npush!(my_graph, ExSymbol(\"BTC\",  \"USDT\", \"BTCUSDT\"))\npush!(my_graph, ExSymbol(\"PEPE\", \"USDT\", \"PEPEUSDT\"))\npush!(my_graph, ExSymbol(\"EOS\",  \"USDT\", \"EOSUSDT\"))","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"To set the context my_ctx, you must use a lower-level method with an explicit specification of the used context, as well as the path search algorithm.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"# \"long\" request for prices from the exchange\njulia> @time my_conv(\"ADA\", \"EOS\")\n  4.740000 seconds (1.80 M allocations: 120.606 MiB, 0.52% gc time, 14.55% compilation time)\n0.6004274502578457\n\n# \"quick\" request for prices from cache\njulia> @time my_conv(\"ADA\", \"EOS\")\n  0.000130 seconds (46 allocations: 2.312 KiB)\n0.6004274502578457","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"With this approach, due to the context, only the first data request will take a long time. Subsequent requests will take much less time.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"You can go further and add a refresh rate for updating the data in the cache.","category":"page"},{"location":"pages/manual/#Pathfinding-algorithm","page":"Manual","title":"Pathfinding algorithm","text":"","category":"section"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"If you are planning to implement your own graph pathfinding method, you should use the following function signature:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"custom_alg(fx::FXGraph, from_id::UInt64, to_id::UInt64) -> Vector{Pair{Integer, Integer}}","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Which returns a vector with pairs of indices corresponding to the fx graph currencies.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"The vector of such pairs should form a chain of conversions of the following form:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"2-element Vector{Pair{Int64, Int64}}:\n 1 => 2\n 2 => 3","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"Then you can use a low-level method to apply your pathfinding algorithm.","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"See previous section to add your own context or just use a dummy one:","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"julia> my_graph = FXGraph();\n\njulia> dummy_ctx = CcyConv.MyCtx();\n\njulia> my_graph(dummy_ctx, custom_alg, \"ADA\", \"USDT\")\n[...]","category":"page"},{"location":"pages/manual/","page":"Manual","title":"Manual","text":"","category":"page"},{"location":"#CcyConv.jl","page":"Home","title":"CcyConv.jl","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"CcyConv is a Julia package for performing currency conversions. It allows for direct and multi-step conversions using the latest exchange 💱 rates.","category":"page"},{"location":"#Installation","page":"Home","title":"Installation","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"If you haven't installed our local registry yet, do that first:","category":"page"},{"location":"","page":"Home","title":"Home","text":"] registry add https://github.com/bhftbootcamp/Green.git","category":"page"},{"location":"","page":"Home","title":"Home","text":"To install CcyConv, simply use the Julia package manager:","category":"page"},{"location":"","page":"Home","title":"Home","text":"] add CcyConv","category":"page"},{"location":"#Usage","page":"Home","title":"Usage","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Here's how you can find a conversion path from ADA to BNB:","category":"page"},{"location":"","page":"Home","title":"Home","text":"graph LR;\n    ADA  --> |0.5911| USDT;\n    ADA  -.->|0.00000892| BTC;\n    BTC  -.->|19.9089| ETH;\n    USDT --> |0.0003| ETH;\n    ETH  --> |5.9404| BNB;\n    USDT -.->|1.6929| XRP;\n    XRP  -.- |NaN| BNB;\n    USDC -.- |1.6920| XRP;\n    ADA  -.- |0.5909| USDC;\n\n    classDef julia_blue fill:#4063D8,stroke:#333,stroke-width:2px;\n    classDef julia_green fill:#389826,stroke:#333,stroke-width:2px;\n    classDef julia_red fill:#CB3C33,stroke:#333,stroke-width:2px;\n    classDef julia_purple fill:#9558B2,stroke:#333,stroke-width:2px;\n    classDef def_color fill:#eee,stroke:#ccc,stroke-width:2px;\n\n    class ADA julia_blue;\n    class USDT julia_red;\n    class ETH julia_green;\n    class BNB julia_purple;","category":"page"},{"location":"","page":"Home","title":"Home","text":"using CcyConv\n\ncrypto = FXGraph()\n\nappend!(\n    crypto,\n    [\n        Price(\"ADA\", \"USDT\", 0.5911),\n        Price(\"ADA\", \"BTC\", 0.00000892),\n        Price(\"BTC\", \"ETH\", 19.9089),\n        Price(\"USDT\", \"ETH\", 0.0003),\n        Price(\"ETH\", \"BNB\", 5.9404),\n        Price(\"USDT\", \"XRP\", 1.6929),\n        Price(\"XRP\", \"BNB\", NaN),\n        Price(\"USDC\", \"XRP\", 1.6920),\n        Price(\"ADA\", \"USDC\", 0.5909),\n    ],\n)\n\nconv = conv_a_star(crypto, \"ADA\", \"BNB\")\n\njulia> conv_value(conv)\n0.0010534111319999999\n\njulia> conv_chain(conv)\n3-element Vector{CcyConv.AbstractPrice}:\n Price(\"ADA\",  \"USDT\", 0.5911)\n Price(\"USDT\", \"ETH\",  0.0003)\n Price(\"ETH\",  \"BNB\",  5.9404)","category":"page"},{"location":"","page":"Home","title":"Home","text":"The package lets you to set up a directed graph containing currencies as vertices and convert rates as edges. The graph can fill the missing data from anywhere and directly during the running conversion path calculation.","category":"page"},{"location":"","page":"Home","title":"Home","text":"using CcyConv\nusing CryptoExchangeAPIs.Binance\n\nstruct MyCtx <: CcyConv.AbstractCtx\n    prices::Dict{String,Float64}\n\n    MyCtx() = new(Dict{String,Float64}())\nend\n\nstruct ExSymbol <: CcyConv.AbstractPrice\n    base_asset::String\n    quote_asset::String\n    symbol::String\nend\n\nfunction CcyConv.from_asset(x::ExSymbol)::String\n    return x.base_asset\nend\n\nfunction CcyConv.to_asset(x::ExSymbol)::String\n    return x.quote_asset\nend\n\nfunction CcyConv.price(ctx::MyCtx, x::ExSymbol)::Float64\n    return get!(ctx.prices, x.symbol) do\n        try\n            Binance.Spot.avg_price(; symbol = x.symbol).result.price\n        catch\n            NaN\n        end\n    end\nend\n\nmy_graph = FXGraph()\nmy_ctx = MyCtx()\n\nappend!(\n    my_graph,\n    [\n        ExSymbol(\"ADA\",  \"BTC\",  \"ADABTC\"),\n        ExSymbol(\"BTC\",  \"USDT\", \"BTCUSDT\"),\n        ExSymbol(\"PEPE\", \"USDT\", \"PEPEUSDT\"),\n        ExSymbol(\"EOS\",  \"USDT\", \"EOSUSDT\"),\n    ],\n)\n\nmy_conv = (to, from) -> conv_value(my_graph(my_ctx, CcyConv.a_star_alg, to, from))\n\njulia> @time my_conv(\"ADA\", \"EOS\")\n  4.740000 seconds (1.80 M allocations: 120.606 MiB, 0.52% gc time, 14.55% compilation time)\n0.6004274502578457\n\njulia> @time my_conv(\"ADA\", \"EOS\")\n  0.000130 seconds (46 allocations: 2.312 KiB)\n0.6004274502578457","category":"page"},{"location":"","page":"Home","title":"Home","text":"","category":"page"},{"location":"pages/api_reference/#API-Reference","page":"API Reference","title":"API Reference","text":"","category":"section"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"CcyConv.AbstractPrice\nCcyConv.AbstractCtx","category":"page"},{"location":"pages/api_reference/#CcyConv.AbstractPrice","page":"API Reference","title":"CcyConv.AbstractPrice","text":"AbstractPrice\n\nAn abstract type representing price of a currency pair.\n\nFor types using this interface the following methods must be defined:\n\nfrom_asset\nto_asset\nprice\n\n\n\n\n\n","category":"type"},{"location":"pages/api_reference/#CcyConv.AbstractCtx","page":"API Reference","title":"CcyConv.AbstractCtx","text":"AbstractCtx\n\nAn abstract type representing workspace context.\n\n\n\n\n\n","category":"type"},{"location":"pages/api_reference/#Price","page":"API Reference","title":"Price","text":"","category":"section"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"CcyConv.Price\nCcyConv.from_asset\nCcyConv.to_asset\nCcyConv.price","category":"page"},{"location":"pages/api_reference/#CcyConv.Price","page":"API Reference","title":"CcyConv.Price","text":"Price <: AbstractPrice\n\nA type representing the price of currency pair.\n\nFields\n\nfrom_asset::String: Base currency name.\nto_asset::String: Quote currency name.\nprice::Float64: The currency pair price.\n\n\n\n\n\n","category":"type"},{"location":"pages/api_reference/#CcyConv.from_asset","page":"API Reference","title":"CcyConv.from_asset","text":"from_asset(x::AbstractPrice) -> String\n\nReturns the name of the base currency of x.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#CcyConv.to_asset","page":"API Reference","title":"CcyConv.to_asset","text":"to_asset(x::AbstractPrice) -> String\n\nReturns the name of the quote currency of x.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#CcyConv.price","page":"API Reference","title":"CcyConv.price","text":"price(x::AbstractPrice) -> Float64\n\nReturns price of the currency pair x.\n\n\n\n\n\nprice(ctx::AbstractCtx, x::AbstractPrice) -> Float64\n\nAdvanced function for getting the price of a currency pair x that can take into account the context of the ctx.\n\nnote: Note\nThis function is called when searching for a currency conversion path and can be overloaded to achieve advanced functionality using context (for example, caching the requested data for subsequent requests). See context guide.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#FXGraph","page":"API Reference","title":"FXGraph","text":"","category":"section"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"CcyConv.FXGraph\nCcyConv.conv_ccys\nCcyConv.push!\nCcyConv.append!","category":"page"},{"location":"pages/api_reference/#CcyConv.FXGraph","page":"API Reference","title":"CcyConv.FXGraph","text":"FXGraph\n\nThis type describes a weighted directed graph in which:\n\nThe nodes are currencies.\nThe edges between such nodes represent a currency pair.\nThe direction of the edge determines the base and quote currency.\nThe weight of the edge is determined by the conversion price of the currency pair.\n\nFields\n\nedge_nodes::Dict{NTuple{2,UInt64},Vector{AbstractPrice}}: Dictionary containing information about conversion prices between nodes.\nedge_encode::Dict{String,UInt64}: A dictionary containing the names of currencies as keys and their identification numbers as values.\ngraph::Graphs.SimpleGraph{Int64}: A graph containing basic information about vertices and edges.\n\n\n\n\n\n","category":"type"},{"location":"pages/api_reference/#CcyConv.conv_ccys","page":"API Reference","title":"CcyConv.conv_ccys","text":"conv_ccys(fx::FXGraph) -> Vector{String}\n\nReturns the names of all currencies stored in the graph fx.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#Base.push!","page":"API Reference","title":"Base.push!","text":"Base.push!(fx::FXGraph, node::AbstractPrice)\n\nAdds a new edge to the graph fx corresponding to the currency pair node.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#Base.append!","page":"API Reference","title":"Base.append!","text":"Base.append!(fx::FXGraph, nodes::Vector{AbstractPrice})\n\nDoes the same as push! but can pass several currency pairs nodes at once.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#ConvRate","page":"API Reference","title":"ConvRate","text":"","category":"section"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"CcyConv.ConvRate\nCcyConv.conv_value\nCcyConv.conv_safe_value\nCcyConv.conv_chain","category":"page"},{"location":"pages/api_reference/#CcyConv.ConvRate","page":"API Reference","title":"CcyConv.ConvRate","text":"ConvRate\n\nAn object describing the price and conversion path between two currencies.\n\nFields\n\nfrom_asset::String: The name of an initial curreny.\nto_asset::String: The name of a target currency.\nconv::Float64: Total currency conversion price.\nchain::Vector{AbstractPrice}: Chain of currency pairs involved in conversion.\n\n\n\n\n\n","category":"type"},{"location":"pages/api_reference/#CcyConv.conv_value","page":"API Reference","title":"CcyConv.conv_value","text":"conv_value(x::ConvRate) -> Float64\n\nReturns the convert rate of x.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#CcyConv.conv_safe_value","page":"API Reference","title":"CcyConv.conv_safe_value","text":"conv_safe_value(x::ConvRate) -> Float64\n\nAsserts that the conversion rate of x is not a NaN value and then returns it. Otherwise throws an AssertionError.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#CcyConv.conv_chain","page":"API Reference","title":"CcyConv.conv_chain","text":"conv_chain(x::ConvRate) -> Vector{AbstractPrice}\n\nReturns the path chain of x.\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/#algorithms","page":"API Reference","title":"Pathfinding","text":"","category":"section"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"Available pathfinding algorithms:","category":"page"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"a_star_alg: The most basic algorithm for finding the shortest path between two currencies.","category":"page"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"CcyConv.conv_a_star","category":"page"},{"location":"pages/api_reference/#CcyConv.conv_a_star","page":"API Reference","title":"CcyConv.conv_a_star","text":"conv_a_star(fx::FXGraph, from_asset::String, to_asset::String) -> ConvRate\n\nUses an A* search algorithm to find the shortest path between from_asset and to_asset currencies in graph fx.\n\nExamples\n\njulia> crypto = FXGraph();\n\njulia> append!(\n           crypto,\n           [\n               Price(\"ADA\",  \"USDT\", 0.4037234),\n               Price(\"USDT\", \"BTC\",  0.0000237),\n               Price(\"BTC\",  \"ETH\",  18.808910),\n               Price(\"ETH\",  \"ALGO\", 14735.460),\n           ],\n       );\n\njulia> conv = conv_a_star(crypto, \"ADA\", \"BTC\");\n\njulia> conv_value(conv)\n0.000009582698067\n\njulia> conv_chain(conv)\n2-element Vector{CcyConv.AbstractPrice}:\n Price(\"ADA\",  \"USDT\", 0.4037234)\n Price(\"USDT\", \"BTC\",  0.0000237)\n\n\n\n\n\n","category":"function"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"CcyConv.FXGraph(::CcyConv.AbstractCtx, ::Function, ::String, ::String)","category":"page"},{"location":"pages/api_reference/#CcyConv.FXGraph-Tuple{CcyConv.AbstractCtx, Function, String, String}","page":"API Reference","title":"CcyConv.FXGraph","text":"(fx::FXGraph)(ctx::AbstractCtx, path_alg::Function, from_asset::String, to_asset::String) -> ConvRate\n\nApplies algorithm path_alg to find a path on graph fx between base currency from_asset and target currency to_asset using context ctx.\n\nnote: Note\nThis method is low-level and is required when using a custom context.\n\n\n\n\n\n","category":"method"},{"location":"pages/api_reference/","page":"API Reference","title":"API Reference","text":"","category":"page"}]
}