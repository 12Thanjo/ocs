/*
* @name ocs
* @type head
* @description a programming paradigm combining traits of OOP and ECS
*/

var OCS = function(){
	var id = String.fromCharCode(Date.now());
	Object.defineProperty(this, "id", {
		get: ()=>{
			return id;
		}
	});
	var { version } = require('./package.json');
	console.log(`%c OCS Initialized | v${version} | id: ${id}`, "background-color: #00667f ; color: #cccccc ; font-size: 16px ; font-family: 'american typewriter';");

	/*
	* @name EEO
	* @type class
	* @description Event Emitting Object. For use in the creation of components. Event is run when the value of a specific property that an Entity gets from a Component is changed.
	* @param {obj}{Object}{object for use in component}
	* @param {event}{Function}{event to run when properties of obj are changed. Takes (entity, key, val) as parameters}
	}
	*/
	var EEO = class{
		#store;
		#event;
		#keys;
		constructor(obj, event){
			this.#store = {}
			this.#event = event;
			this.entity = {};
			this.#keys = [];

			var self = this;
			var odp = function(key){// stands for Object.defineProperty
				Object.defineProperty(self, key, {
					get: ()=>{
						return self.#store[key];
					},
					set: (val)=>{
						self.#store[key] = val;
						if(self.#event(self.entity, key, val) != null){
							self.#store[key] = val;
						}
					}
				});					
			}
			for(var key in obj){
				this.#store[key] = obj[key];
				odp(key);
				this.#keys.push(key);
			}

			/*
			* @name keys
			* @type property
			* @description a reference to the keys associated with the EEO.
			* @parent EEO
			* @proto [String]
			*/
			Object.defineProperty(this, "keys", {
				get: ()=>{
					return this.#keys;
				}
			});

			/*
			* @name event
			* @type method
			* @description a reference to the event associated with this EEO
			* @parent EEO
			*/
			Object.defineProperty(this, "event", {
				get: ()=>{
					return this.#event;
				}
			});
		}
	}

	/*
	* @name Getter
	* @type class
	* @description For use in the creation of components. Event is run when getting the value of a specific property and this property does not have a setter.
	* @param {arr}{[String]}{keys of the getter}
	* @param {event}{Function}{event to run when when the property is gotten. Takes (entity, key) as parameters}
	*/
	var Getter = class{
		#event;
		#keys;
		constructor(arr, event){
			this.#event = event;
			this.entity = {};
			this.#keys = [];

			var self = this;
			var odp = function(key){
				Object.defineProperty(self, key, {
					get: ()=>{
						return self.#event(self.entity, key);
					}
				});					
			}

			arr.forEach((key)=>{
				odp(key);
				this.#keys.push(key);
			});

			/*
			* @name keys
			* @type property
			* @description a reference to the keys associated with the Getter.
			* @parent Getter
			* @proto [String]
			*/
			Object.defineProperty(this, "keys", {
				get: ()=>{
					return this.#keys;
				}
			});

			/*
			* @name event
			* @type method
			* @description a reference to the event associated with this Getter
			* @parent Getter
			*/
			Object.defineProperty(this, "event", {
				get: ()=>{
					return this.#event;
				}
			});
		}
	}




	/*
	* @name Environment
	* @type class
	* @description environment 
	* @param {name}{String,Number}{unique name of the Environment}
	*/
	var environments = new Map();
	var Environment = class{
		#name;
		constructor(name){
			if(environments.has(name)){
				throw new SyntaxError(`Environment (${name}) has already been declared`);
			}

			this.#name = name;
			/*
			* @name name
			* @type prop
			* @description reference to the name of the Environment
			* @parent Environment
			* @proto String,Number
			*/
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});
			environments.set(name, this);
			components.set(name, new Map());
			entities.set(name, new Map());
			components_entities.set(name, new Map());
		}

		/*
		* @name getComponent
		* @type method
		* @description get a specific component in this Environment
		* @parent Environment
		* @param {name}{String,Number}{name of the component}
		*/
		getComponent = function(name){
			return components.get(this.#name).get(name);
		}

		/*
		* @name addComponent
		* @type method
		* @description duplicates a component from another environment and adds it to itself
		* @parent Environment
		* @param {environment}{String,Number}{name of the environment to duplicate the component from}
		* @param {component}{String,Number}{name of the component to duplicate}
		*/
		addComponent = function(environment, component){
			var env = components.get(environment);
			if(env == null){
				throw new ReferenceError(`Environment (${environment}) has not been declared`);
			}else if(components.get(this.#name).has(component)){
				throw new ReferenceError(`Environment (${this.#name}) already has a component (${component})`);
			}else if(!env.has(component)){
				throw new ReferenceError(`Environment (${environment}) does not have component (${component})`);
			}
			env.get(component).duplicate(this.#name);
		}

		/*
		* @name hasComponent
		* @type method
		* @description returns if the environment contains a component with a given name
		* @parent Environment
		* @param {component}{String,Number}{name of the component}
		*/
		hasComponent = function(component){
			return components.get(this.#name).has(component);
		}

		/*
		* @name removeComponent
		* @type method
		* @description removes a component from the Environment, and from all the Entities in this Environment
		* @parent Environment
		* @param {component}{String,Number}{name of the component}
		*/
		removeComponent = function(component){
			var env = components.get(this.#name);
			if(env.has(component)){
				env.delete(component);
			}else{
				throw new ReferenceError(`Environment (${this.#name}) does not have component (${component})`);
			}
		}

		/*
		* @name printComponents
		* @type method
		* @description returns an array containing the names of all the Components in this Environment.
		* @parent Environment
		*/
		printComponents = function(){
			var output = [];
			components.get(this.#name).forEach((component)=>{
				output.push(component.name);
			});
			return output;
		}

		/*
		* @name addEntity
		* @type method
		* @description creates a new Entity and adds it to this Environment
		* @parent Environment
		* @param {entity}{String,Number}{unique name of this new Entity}
		*/
		addEntity = function(entity){
			if(entities.get(this.#name).has(entity)){
				throw new SyntaxError(`Entity (${entity}) in Environment (${this.#name}) has already been declared`);
			}
			return new Entity(this.#name, entity);
		}

		/*
		* @name getEntity
		* @type method
		* @description gets a specific entity in the Environment
		* @parent Environment
		* @param {entity}{String,Number}{name of the Entity}
		*/
		getEntity = function(entity){
			return entities.get(this.#name).get(entity);
		}

		/*
		* @name printEntities
		* @type method
		* @description returns an array containing the names of all the Entities in this Environment.
		* @parent Environment
		*/
		printEntities = function(){
			var output = [];
			entities.get(this.#name).forEach((entity)=>{
				output.push(entity.name);
			});
			return output;
		}
	}

	/*
	* @name Component
	* @type class
	* @description defines properties that can be added to entities
	* @param {environment}{String,Number}{name of the environment to add the component to}
	* @param {name}{String,Number}{unique name of the component}
	* @param {builder}{Function}{a function that returns an object containing properties to add to entities. This function can take whatever parameters you would like}
	*/
	var components = new Map();
	var components_entities = new Map();
	var Component = class{
		#name;
		#builder;
		#environment;
		constructor(environment, name, builder){
			/*
			* @name name
			* @type property
			* @description reference to the name of the component
			* @parent Component
			* @proto String,Number
			*/
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

			/*
			* @name builder
			* @type property
			* @description reference to the builder of the component
			* @parent Component
			* @proto Function
			*/
			this.#builder = builder;
			Object.defineProperty(this, "builder", {
				get: ()=>{
					return this.#builder;
				}
			});

			if(!components_entities.has(environment)){
				throw new ReferenceError(`Environment (${environment}) is not set`);
			}
			this.#environment = environments.get(environment);
			components_entities.get(environment).set(name, new Set());
			components.get(environment).set(name, this);
		}

		/*
		* @name getEntites
		* @type method
		* @description returns an array of all the Entities containing this Component
		* @parent Component
		*/
		getEntities = function(){
			var output = [];
			var list = components_entities.get(this.#environment.name).get(this.#name);
			list.forEach((entity)=>{
				output.push(entity);
			});
			return output;
		}

		/*
		* @name printEntites
		* @type method
		* @description returns an array of the names of all the Entities containing this Component
		* @parent Component
		*/
		printEntities = function(){
			var output = [];
			var list = components_entities.get(this.#environment.name).get(this.#name);
			list.forEach((entity)=>{
				output.push(entity.name);
			});
			return output;
		}

		/*
		* @name duplicate
		* @type method
		* @description duplicate this Component to another Environment
		* @parent Component
		* @param {environment}{String,Number}{Name of the Environment to add the duplicated Component to}
		*/
		duplicate = function(environment){
			return new Component(environment, this.#name, this.#builder);
		}

		/*
		* @name destroy
		* @type method
		* @description destroy this Component and remove it from all Entities that have this Component
		* @parent Component
		*/
		destroy = function(){
			var entities = this.getEntities();
			entities.forEach((entity)=>{
				entity.removeComponent(this.#name);
			});
			this.#environment.removeComponent(this.#name);
		}
	}

	/*
	* @name Entity
	* @type class
	* @description general purpose object
	* @param {environment}{String,Number}{name of the Environment to add the Entity to}
	* @param {name}{String,Number}{unique name of the Entity}
	* @param {limit}{Int}{<b>(OPTIONAL)</b> limit of key depth when adding Components}{3}
	*/
	var entities = new Map();
	var Entity = class{
		#tags;
		#name;
		#components;
		#environment;
		#limit;
		#store;
		constructor(environment, name, limit){
			/*
			* @name name
			* @type property
			* @description reference to the name of the Entity
			* @parent Entity
			*/
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

			this.#tags = new Set();
			this.#components = new Set();
			this.#environment = environments.get(environment);
			if(this.#environment == null){
				throw new ReferenceError(`Environment (${environment}) is not set`);
			}
			if(entities.get(environment).has(name)){
				throw new SyntaxError(`Entity (${name}) in Environment (${environment}) has already been declared`);
			}
			entities.get(environment).set(name, this);

			this.#limit = limit || 3;
			this.#store = {};

			/*
			* @name environment
			* @type property
			* @description reference to the Environment this Entity is a part of
			* @parent Entity
			*/
			Object.defineProperty(this, "environment", {
				get: ()=>{
					return this.#environment;
				}
			});
		}

		/*
		* @name addTag
		* @type method
		* @description add a Tag to this Entity
		* @parent Entity
		* @param {tag}{String,Number}{Tag to add}
		*/
		addTag = function(tag){
			this.#tags.add(tag);
			if(!tags_entities.has(tag)){
				throw new ReferenceError(`Tag (${this.#name}) is not set`);
			}
			tags_entities.get(tag).add(this);
		}

		/*
		* @name hasTag
		* @type method
		* @description return if this Entity has a given Tag
		* @parent Entity
		* @param {tag}{String,Number}{Tag to check}
		*/
		hasTag = function(tag){
			return this.#tags.has(tag);
		}

		/*
		* @name removeTag
		* @type method
		* @description remove a Tag from this Entity
		* @parent Entity
		* @param {tag}{String,Number}{Tag to remove}
		*/
		removeTag = function(tag){
			if(!this.#tags.has(tag)){
				throw new ReferenceError(`Entity (${this.#name}) in Environment (${this.#environment}) does not have tag (${tag})`);
			}
			this.#tags.delete(tag);
			tags_entities.get(tag).delete(this);
		}

		/*
		* @name printTags
		* @type method
		* @description return an array of all the Tags this Entity has
		* @parent Entity
		*/
		printTags = function(){
			return Array.from(this.#tags);
		}

		/*
		* @name addComponent
		* @type method
		* @description add a component to this Entity
		* @parent Entity
		* @param {component}{String,Number}{Component to add}
		* @param {...params}{any}{params to pass to the Component builder}
		*/
		addComponent = function(component, ...params){
			var comp = this.#environment.getComponent(component);
			if(comp != null){
				var builder = comp.builder(...params);
				if(builder instanceof EEO){
					builder.entity = this;
					builder.keys.forEach((key)=>{
						if(this[key] != null){
							throw new SyntaxError(`key (${key}) in Entity (${this.#name}) has already been declared`);
						}
						this.#store[key] = builder[key];
						Object.defineProperty(this, key, {
							configurable: true,
							get: ()=>{
								return this.#store[key];
							},
							set: (val)=>{
								this.#store[key] = val;
								builder.event(this, key, val);
							}
						});
					});
				}else if(builder instanceof Getter){
					builder.entity = this;
					builder.keys.forEach((key)=>{
						if(this[key] != null){
							throw new SyntaxError(`key (${key}) in Entity (${this.#name}) has already been declared`);
						}

						Object.defineProperty(this, key, {
							configurable: true,
							get: ()=>{
								return builder.event(this, key);
							}
						});
					});
				}else{
					var traverse_builder = function(target, self, count){
						if(typeof target == "object" && target != null && count > 0){
							if(target instanceof EEO || target instanceof Getter){
								target.entity = self;
							}
							for(var key in target){
								traverse_builder(target[key], self, count-1);
							}
						}
					}
					traverse_builder(builder, this, this.#limit);
					for(var key in builder){
						if(this[key] != null){
							throw new SyntaxError(`key (${key}) in Entity (${this.#name}) has already been declared`);
						}
						this[key] = builder[key];
					}
				}


				this.#components.add(component);
				components_entities.get(this.#environment.name).get(component).add(this);
				return this;
			}else{
				throw new ReferenceError(`Environment (${this.#environment.name}) does not have component (${component})`);
			}
		}

		/*
		* @name hasComponent
		* @type method
		* @description returns if this Entity has a specific Component
		* @parent Entity
		* @param {component}{String,Number}{name of the Component}
		*/
		hasComponent = function(component){
			return this.#components.has(component);
		}

		/*
		* @name removeComponent
		* @type method
		* @description removes a Component from this Entity
		* @parent Entity
		* @param {component}{String,Number}{name of the Component}
		*/
		removeComponent = function(component){
			var comp = this.#environment.getComponent(component);
			if(comp == null){
				throw new ReferenceError(`Entity (${this.#name}) in Environment (${this.#environment}) does not have component (${component})`);	
			}
			var builder = comp.builder();
			if(builder instanceof EEO){
				builder.keys.forEach((key)=>{
					Object.defineProperty(this, key, {
						get: ()=>{},
						set: ()=>{}
					});
					delete this.#store[key];
				});
			}if(builder instanceof Getter){
				builder.keys.forEach((key)=>{
					Object.defineProperty(this, key, {
						get: ()=>{}
					});
				});
			}else{
				for(var key in builder){
					delete this[key];
				}
			}

			this.#components.delete(component);
			return this;
		}

		/*
		* @name printComponents
		* @type method
		* @description returns an array of the names of all the Components this Entity has
		* @parent Entity
		*/
		printComponents = function(){
			var output = [];
			this.#components.forEach((component)=>{
				output.push(component);
			});
			return output;
		}

		/*
		* @name destroy
		* @type method
		* @description destroy this Entity
		* @parent Entity
		*/
		destroy = function(){
			entities.get(this.#environment.name).delete(this.#name);
			this.#components.forEach((component)=>{
				components_entities.get(this.#environment.name).get(component).delete(this);
			});
			this.#tags.forEach((tag)=>{
				tags_entities.get(tag).delete(this);
			});
		}
	}

	/*
	* @name Tag
	* @type class
	* @description Tag identifiers that can be added to Entities
	* @param {name}{String,Number}{the unique name of the Tag}
	*/
	var tags = new Map();
	var tags_entities = new Map();
	var Tag = class{
		#name;
		constructor(name){
			/*
			* @name name
			* @type property
			* @description Reference to the name of the tag
			* @parent Tag
			*/
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

			tags.set(name, this);
			tags_entities.set(name, new Set());
		}

		/*
		* @name getEntities
		* @type method
		* @description return an array with all the entities that have this Tag
		* @parent Tag
		*/
		getEntities = function(){
			var output = [];
			var list = tags_entities.get(this.#name);
			list.forEach((entity)=>{
				output.push(entity);
			});
			return output;
		}

		/*
		* @name printEntities
		* @type method
		* @description return an array with the names all the entities that have this Tag
		* @parent Tag
		*/
		printEntities = function(){
			var output = [];
			var list = tags_entities.get(this.#name);
			list.forEach((entity)=>{
				output.push(entity.name);
			});
			return output;
		}

		/*
		* @name destroy
		* @type method
		* @description destroy this Tag and remove it from all Entities
		* @parent Tag
		*/
		destroy = function(){
			var entities = this.getEntities();
			entities.forEach((entity)=>{
				entity.removeTag(this.#name);
			});
		}
	}

	/*
	* @name Singleton
	* @type class
	* @description creates a single instance of an object or module that can be accessed in any module
	* @param {name}{String,Number}{the unique name of the Singleton}
	* @apram {instance}{Object}{the singleton instance}
	*/
	var singletons = new Map();
	var Singleton = class{
		#name;
		#instance;
		constructor(name, instance){
			/*
			* @name name
			* @type property
			* @description reference to the name of the Singleton
			* @parent Singleton
			* @proto String
			*/
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

			/*
			* @name instance
			* @type property
			* @description reference to the name of the instance
			* @parent Singleton
			* @proto Object
			*/
			this.#instance = instance;
			Object.defineProperty(this, "instance", {
				get: ()=>{
					return this.#instance;
				}
			});

			singletons.set(name, this);
		}

		/*
		* @name duplicate
		* @type method
		* @description duplicate the Singleton
		* @parent Singleton
		* @param {name}{String,Nunber}{the name of the new Singleton}
		*/
		duplicate = function(name){
			return new Singleton(name, this.#instance);
		}

		/*
		* @name destroy
		* @type method
		* @description destroy this Singleton
		* @parent Singleton
		*/
		destroy = function(){
			this.#instance = null;
			singletons.delete(this.#name);
		}
	}



	return {
		Environment: Environment,
		Component: Component,
		Entity: Entity,
		Tag: Tag,
		EEO: EEO,
		Getter: Getter,
		Singleton: Singleton,

		/*
		* @name getEnvironment
		* @type method
		* @description get a specific Environment
		* @param {name}{String,Number}{name of the Environment}
		*/
		getEnvironment: function(name){
			return environments.get(name);
		},

		/*
		* @name getComponent
		* @type method
		* @description get a specific Component
		* @param {name}{String,Number}{name of the Component}
		*/
		getComponent: function(environment, name){
			return components.get(environment).get(name);
		},

		/*
		* @name getEntity
		* @type method
		* @description get a specific Entity
		* @param {name}{String,Number}{name of the Entity}
		*/

		getEntity: function(environment, name){
			return entities.get(environment).get(name);
		},

		/*
		* @name getTag
		* @type method
		* @description get a specific Tag
		* @param {name}{String,Number}{name of the Tag}
		*/
		getTag: function(name){
			return tags.get(name);
		},

		/*
		* @name getSingleton
		* @type method
		* @description get a specific Singleton
		* @param {name}{String,Number}{name of the Singleton}
		*/
		getSingleton: function(name){
			return singletons.get(name);
		},

		/*
		* @name getAllWithComponents
		* @type method
		* @description get all entities that contain a sinlge (or multiple) component
		* @param {environment}{String,Number}{Environment to search}
		* @param {components}{String,[String]}{component or components to check for}
		*/
		getAllWithComponents: function(environment, components){
			if(components instanceof Array){
				if(components.length > 1){
					var list = this.getComponent(environment, components[0]).getEntities();
					var output = [];
					var env = environments.get(environment);
					list.forEach((entity_name)=>{
						var pass = true;
						var entity = env.getEntity(entity_name);

						for(var i = components.length - 1; i>0; i--){
							if(!entity.hasComponent(components[i])){
								pass = false;
								break;
							}
						}

						if(pass){
							output.push(entity);
						}
					});
					return output;
				}else{
					return this.getComponent(environment, components[0]).getEntities();
				}
			}else{
				return this.getComponent(environment, components).getEntities();
			}
		},

		/*
		* @name printAllWithComponents
		* @type method
		* @description get the names of all entities that contain a sinlge (or multiple) component
		* @param {environment}{String,Number}{Environment to search}
		* @param {components}{String,[String]}{component or components to check for}
		*/
		printAllWithComponents: function(environment, components){
			if(components instanceof Array){
				if(components.length > 1){
					var list = this.getComponent(environment, components[0]).getEntities();
					var output = [];
					var env = environments.get(environment);
					list.forEach((entity_name)=>{
						var pass = true;
						var entity = env.getEntity(entity_name);

						for(var i = components.length - 1; i>0; i--){
							if(!entity.hasComponent(components[i])){
								pass = false;
								break;
							}
						}

						if(pass){
							output.push(entity.name);
						}
					});
					return output;
				}else{
					return this.getComponent(environment, components[0]).printEntities();
				}
			}else{
				return this.getComponent(environment, components).printEntities();
			}
		},
	}
}

module.exports = new OCS();