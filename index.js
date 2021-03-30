var OCS = function(){
	console.log("OCS initialized");
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
			var odp = function(key){
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

			Object.defineProperty(this, "keys", {
				get: ()=>{
					return this.#keys;
				}
			});

			Object.defineProperty(this, "event", {
				get: ()=>{
					return this.#event;
				}
			});
		}
	}


	var environments = new Map();
	var Environment = class{
		#name;
		constructor(name){
			if(environments.has(name)){
				throw new SyntaxError(`Environment (${name}) has already been declared`);
			}

			this.#name = name;
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

		getComponent = function(name){
			return components.get(this.#name).get(name);
		}
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
		hasComponent = function(component){
			return components.get(this.#name).has(component);
		}
		removeComponent = function(component){
			var env = components.get(this.#name);
			if(env.has(component)){
				env.delete(component);
			}else{
				throw new ReferenceError(`Environment (${this.#name}) does not have component (${component})`);
			}
		}
		printComponents = function(){
			var output = [];
			components.get(this.#name).forEach((component)=>{
				output.push(component.name);
			});
			return output;
		}

		addEntity = function(entity){
			if(entities.get(this.#name).has(entity)){
				throw new SyntaxError(`Entity (${entity}) in Environment (${this.#name}) has already been declared`);
			}
			return new Entity(this.#name, entity);
		}
		getEntity = function(entity){
			return entities.get(this.#name).get(entity);
		}
		printEntities = function(){
			var output = [];
			entities.get(this.#name).forEach((entity)=>{
				output.push(entity.name);
			});
			return output;
		}

	}

	var components = new Map();
	var components_entities = new Map();
	var Component = class{
		#name;
		#builder;
		#environment;
		constructor(environment, name, builder){
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

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

		getEntities = function(){
			var output = [];
			var list = components_entities.get(this.#environment.name).get(this.#name);
			list.forEach((entity)=>{
				output.push(entity);
			});
			return output;
		}


		printEntities = function(){
			var output = [];
			var list = components_entities.get(this.#environment.name).get(this.#name);
			list.forEach((entity)=>{
				output.push(entity.name);
			});
			return output;
		}

		duplicate = function(environment){
			return new Component(environment, this.#name, this.#builder);
		}

		destroy = function(){
			var entities = this.getEntities();
			entities.forEach((entity)=>{
				entity.removeComponent(this.#name);
			});
			this.#environment.removeComponent(this.#name);
		}
	}

	var entities = new Map();
	var Entity = class{
		#tags;
		#name;
		#components;
		#environment;
		#limit;
		#store;
		constructor(environment, name, limit){
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

			this.#limit = limit || 2;
			this.#store = {};
		}

		addTag = function(tag){
			this.#tags.add(tag);
			if(!tags_entities.has(tag)){
				throw new ReferenceError(`Tag (${this.#name}) is not set`);
			}
			tags_entities.get(tag).add(this);
		}
		hasTag = function(tag){
			return this.#tags.has(tag);
		}
		removeTag = function(tag){
			if(!this.#tags.has(tag)){
				throw new ReferenceError(`Entity (${this.#name}) in Environment (${this.#environment}) does not have tag (${tag})`);
			}
			this.#tags.delete(tag);
			tags_entities.get(tag).delete(this);
		}
		printTags = function(){
			return Array.from(this.#tags);
		}

		addComponent = function(component, ...params){
			var comp = this.#environment.getComponent(component);
			if(comp != null){
				var builder = comp.builder(...params);
				if(builder instanceof EEO){
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
				}else{
					var traverse_builder = function(target, self, count){
						if(typeof target == "object" && target != null && count > 0){
							if(target instanceof EEO){
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
		hasComponent = function(component){
			return this.#components.has(component);
		}
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
			}else{
				for(var key in builder){
					delete this[key];
				}
			}

			this.#components.delete(component);
			return this;
		}

		printComponents = function(){
			var output = [];
			this.#components.forEach((component)=>{
				output.push(component);
			});
			return output;
		}

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

	var tags = new Map();
	var tags_entities = new Map();
	var Tag = class{
		#name;
		constructor(name){
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

			tags.set(name, this);
			tags_entities.set(name, new Set());
		}

		getEntities = function(){
			var output = [];
			var list = tags_entities.get(this.#name);
			list.forEach((entity)=>{
				output.push(entity);
			});
			return output;
		}


		printEntities = function(){
			var output = [];
			var list = tags_entities.get(this.#name);
			list.forEach((entity)=>{
				output.push(entity.name);
			});
			return output;
		}

		destroy = function(){
			var entities = this.getEntities();
			entities.forEach((entity)=>{
				entity.removeTag(this.#name);
			});
		}
	}


	var singletons = new Map();
	var Singleton = class{
		#name;
		#instance;
		constructor(name, instance){
			this.#name = name;
			Object.defineProperty(this, "name", {
				get: ()=>{
					return this.#name;
				}
			});

			this.#instance = instance;
			Object.defineProperty(this, "instance", {
				get: ()=>{
					return this.#instance;
				}
			});

			singletons.set(name, this);
		}

		duplicate = function(name){
			return new Singleton(name, this.#instance);
		}

		destroy = function(){
			singletons.delete(this.#name);
		}
	}


	
	this.getEnvironment = function(name){
		return environments.get(name);
	}
	this.getComponent = function(environment, name){
		return components.get(environment).get(name);
	}
	this.getEntity = function(environment, name){
		return entities.get(environment).get(name);
	}
	this.getTag = function(name){
		return tags.get(name);
	}
	this.getSingleton = function(name){
		return singletons.get(name);
	}

	this.getAllWithComponents = function(environment, components){
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
	}

	this.printAllWithComponents = function(environment, components){
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
	}

	Object.defineProperty(this, "Environment", {
		get: ()=>{
			return Environment;
		}
	});

	Object.defineProperty(this, "Component", {
		get: ()=>{
			return Component;
		}
	});

	Object.defineProperty(this, "Entity", {
		get: ()=>{
			return Entity;
		}
	});

	Object.defineProperty(this, "Tag", {
		get: ()=>{
			return Tag;
		}
	});

	Object.defineProperty(this, "EEO", {
		get: ()=>{
			return EEO;
		}
	});

	Object.defineProperty(this, "Singleton", {
		get: ()=>{
			return Singleton;
		}
	});
}

module.exports = new OCS();